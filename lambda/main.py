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


handler = Mangum(app)
