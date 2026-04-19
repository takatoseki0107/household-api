import json
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
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"message": "登録しました", "transactionId": item["transactionId"]}


@app.get("/transactions")
def get_transactions(request: Request):
    user_id = get_user_id(request)
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id)
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))
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
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))
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
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

    items = response.get("Items", [])
    income = sum(int(i["amount"]) for i in items if i["type"] == "income")
    expense = sum(int(i["amount"]) for i in items if i["type"] == "expense")
    balance = income - expense

    prompt = f"""あなたは家計管理のアドバイザーです。
以下の家計データを分析して、日本語で簡潔なアドバイスを3点述べてください。

収入合計: {income}円
支出合計: {expense}円
残高: {balance}円

アドバイス:"""

    bedrock = boto3.client("bedrock-runtime", region_name="ap-northeast-1")
    try:
        result = bedrock.invoke_model(
            modelId="anthropic.claude-haiku-4-5-20251001",
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
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

    body = json.loads(result["body"].read())
    advice = body["content"][0]["text"]
    return {"advice": advice}


handler = Mangum(app)
