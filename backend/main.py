from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title = "Sistema de clientes ")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient(os.getenv("MONGO_URI"))
collection = client["Cluster0"]["clientes"]

class Cliente(BaseModel):
    nome: str
    email: str
    idade: int

def proximo_id():
    ultimo_id = collection.find_one(sort = [("id",-1)])
    return (ultimo_id["id"+1]) if ultimo_id else 1
 
def formatar(c):
    return {"id" : c["id"], "nome": c["nome"], "email" : c["email"], "idade" : c["idade"]}

@app.get("/client")
def listar():
    return [formatar(c) for c in collection.find(sort = [("id", 1)])]

@app.post("/client", status_code = 201)
def criar(dados: Cliente):
    cliente = {"id":proximo_id(), **dados.model_dump()}
    collection.insert_one(cliente)
    return formatar(cliente)

@app.put("/client/{id}")
def atualizar(id:int, dados:Cliente):
    if not collection.find_one({"id":id}):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    collection.update_one({"id":id}, {"$set":dados.model_dump()})
    return {"mensagem":"Cliente atualizado"}

@app.delete("/client/{id}")
def deletar(id:int):
    if not collection.find_one({"id":id}):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    collection.delete_one({"id":id})
    return {"mensagem":"Cliente deletado"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8000,
        reload=True
    )