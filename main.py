from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "家計管理APIへようこそ！"}