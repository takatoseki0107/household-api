import json
import boto3
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

app = FastAPI()

dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = dynamodb.Table("household-transactions")


class Transaction(BaseModel):
    type: str  # "income" or "expense"
    amount: int
    category: str
    memo: Optional[str] = None
    date: str  # "2026-04-18"


@app.post("/transactions")
def create_transaction(body: Transaction, user_id: str = "test-user"):
    item = {
        "userId": user_id,
        "transactionId": str(uuid.uuid4()),
        "type": body.type,
        "amount": body.amount,
        "category": body.category,
        "memo": body.memo or "",
        "date": body.date,
        "createdAt": datetime.utcnow().isoformat(),
    }
    table.put_item(Item=item)
    return {"message": "登録しました", "transactionId": item["transactionId"]}


@app.get("/transactions")
def get_transaction