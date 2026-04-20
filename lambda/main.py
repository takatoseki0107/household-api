import json
import os
import boto3
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request
from mangum import Mangum
from pydantic import BaseModel
from typing import Optional, Literal
from decimal import Decimal
from botocore.exceptions import ClientError

app = FastAPI()

dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = dynamodb.Table("household-transactions")
bedrock = boto3.client("bedrock-runtime", region_name="ap-northeast-1")
sns = boto3.client("sns", region_name="ap-northeast-1")

SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")
BUDGET_THRESHOLD = int(os.environ.get("BUDGET_THRESHOLD", "100000"))


class Transaction(BaseModel):
    type: Literal["income", "expense"]
    amount: int
    category: str
    memo: Optional[str] = None
    date: str


def get_user_id(request: Request) -> str:
    return request.scope["aws.event"]["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]


@app.post("/transactions")
def create_transaction(body: Transaction, request: Request):
    user_id = get_user_id(request)
    item = {
        "userId": user_id,
        "transactionId": str(uuid.uuid4()),
        "type": body.type,
        "amount": body.amount,
        "category": body.category,
        "memo": body.memo or "",
        "date": body.date,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    try:
        table.put_item(Item=item)
    except ClientError:
        raise HTTPException(status_code=500, detail="サーバーエラーが発生しました")

    if body.type == "expense":
        try:
            response = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id)
            )
            items = response.get("Items", [])
            total_expense = sum(int(i["amount"]) for i in items if i["type"] == "expense")
            if total_expense >= BUDGET_THRESHOLD and SNS_TOPIC_ARN:
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="【家計管理API】予算オーバーの通知",
                    Message=f"支出合計が予算({BUDGET_THRESHOLD:,}円)を超えました。\n現在の支出合計: {total_expense:,}円",
                )
        except ClientError:
            pass

    return {"message": "登録しました", "transactionId": item["transactionId"]}


@app.get("/transactions")
def get_transactions(request: Request):
    user_id = get_user_id(request)
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id)
        )
    except ClientError:
        raise HTTPException(status_code=500, detail="サーバーエラーが発生しました")
    items = response.get("Items", [])
    for item in items:
        item["amount"] = int(item["amount"])
    return {"transactions": items}


@app.get("/transactions/summary")
def get_summary(request: Request):
    user_id = get_user_id(request)
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id)
        )
    except ClientError:
        raise HTTPException(status_code=500, detail="サーバーエラーが発生しました")
    items = response.get("Items", [])
    income = sum(int(i["amount"]) for i in items if i["type"] == "income")
    expense = sum(int(i["amount"]) for i in items if i["type"] == "expense")
    return {
        "income": income,
        "expense": expense,
        "balance": income - expense,
    }


@app.get("/transactions/advice")
def get_advice(request: Request):
    user_id = get_user_id(request)
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id)
        )
    except ClientError:
        raise HTTPException(status_code=500, detail="サーバーエラーが発生しました")

    items = response.get("Items", [])
    if not items:
        return {"advice": "まずは収支を登録してみましょう"}

    income = sum(int(i["amount"]) for i in items if i["type"] == "income")
    expense = sum(int(i["amount"]) for i in items if i["type"] == "expense")
    balance = income - expense

    prompt = f"""あなたは家計管理のアドバイザーです。
以下の家計データを分析して、日本語で簡潔なアドバイスを3点述べてください。

収入合計: {income}円
支出合計: {expense}円
残高: {balance}円

アドバイス:"""

    try:
        result = bedrock.invoke_model(
            modelId="jp.anthropic.claude-haiku-4-5-20251001-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 512,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            })
        )
    except ClientError:
        raise HTTPException(status_code=500, detail="サーバーエラーが発生しました")

    body = json.loads(result["body"].read())
    advice = body.get("content", [{}])[0].get("text", "アドバイスを生成できませんでした")
    return {"advice": advice}


handler = Mangum(app)
