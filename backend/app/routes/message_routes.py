"""
Message routes: basic request/poll chat between a user and a worker.
(No websockets for MVP simplicity — frontend polls GET on an interval.)
"""
from fastapi import APIRouter, HTTPException
from app.config.db import messages_col, users_col, workers_col
from app.models.message import MessageCreate, MessageReadUpdate
from app.utils.helpers import now_utc, to_object_id, serialize_many

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/")
def send_message(payload: MessageCreate):
    user_oid = to_object_id(payload.user_id)
    worker_oid = to_object_id(payload.worker_id)

    if not users_col.find_one({"_id": user_oid}):
        raise HTTPException(status_code=404, detail="User not found")
    if not workers_col.find_one({"_id": worker_oid}):
        raise HTTPException(status_code=404, detail="Worker not found")

    doc = {
        "user_id": user_oid,
        "worker_id": worker_oid,
        "sender": payload.sender,  # "user" or "worker"
        "message": payload.message,
        "timestamp": now_utc(),
        "read_by_user": payload.sender == "user",
        "read_by_worker": payload.sender == "worker",
    }
    if payload.image:
        doc["image"] = payload.image

    insert_result = messages_col.insert_one(doc)
    doc["_id"] = insert_result.inserted_id
    
    # Broadcast to websocket if any clients are connected
    import asyncio
    thread_id = f"{payload.user_id}_{payload.worker_id}"
    serialized_doc = serialize_many([doc])[0]
    
    # Fire and forget the broadcast, it's ok if it fails or no one is listening
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(manager.broadcast_to_thread(thread_id, serialized_doc))
    except Exception:
        pass
        
    return {"message": "Message sent", "data": serialized_doc}


@router.get("/{user_id}/{worker_id}")
def get_chat_thread(user_id: str, worker_id: str):
    cursor = messages_col.find({
        "user_id": to_object_id(user_id),
        "worker_id": to_object_id(worker_id),
    }).sort("timestamp", 1)
    return serialize_many(list(cursor))


@router.patch("/{user_id}/{worker_id}/read")
def mark_thread_read(user_id: str, worker_id: str, payload: MessageReadUpdate):
    if payload.viewer == "user":
        messages_col.update_many(
            {
                "user_id": to_object_id(user_id),
                "worker_id": to_object_id(worker_id),
                "sender": "worker",
            },
            {"$set": {"read_by_user": True}}
        )
    else:
        messages_col.update_many(
            {
                "user_id": to_object_id(user_id),
                "worker_id": to_object_id(worker_id),
                "sender": "user",
            },
            {"$set": {"read_by_worker": True}}
        )
    return {"message": "Thread marked read"}


@router.get("/unread/user/{user_id}")
def get_user_unread_counts(user_id: str):
    pipeline = [
        {"$match": {
            "user_id": to_object_id(user_id),
            "sender": "worker",
            "$or": [{"read_by_user": False}, {"read_by_user": {"$exists": False}}]
        }},
        {"$group": {"_id": "$worker_id", "count": {"$sum": 1}}}
    ]
    counts = list(messages_col.aggregate(pipeline))
    return [{"worker_id": str(c["_id"]), "count": c["count"]} for c in counts]


@router.get("/unread/worker/{worker_id}")
def get_worker_unread_counts(worker_id: str):
    pipeline = [
        {"$match": {
            "worker_id": to_object_id(worker_id),
            "sender": "user",
            "$or": [{"read_by_worker": False}, {"read_by_worker": {"$exists": False}}]
        }},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]
    counts = list(messages_col.aggregate(pipeline))
    return [{"user_id": str(c["_id"]), "count": c["count"]} for c in counts]


from fastapi import WebSocket, WebSocketDisconnect
from app.websocket import manager
import json

@router.websocket("/ws/{user_id}/{worker_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, worker_id: str):
    thread_id = f"{user_id}_{worker_id}"
    await manager.connect(websocket, thread_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting JSON data: {"sender": "user" or "worker", "message": "hello", "image": "optional_url"}
            payload = json.loads(data)
            
            user_oid = to_object_id(user_id)
            worker_oid = to_object_id(worker_id)
            
            doc = {
                "user_id": user_oid,
                "worker_id": worker_oid,
                "sender": payload.get("sender"),
                "message": payload.get("message", ""),
                "timestamp": now_utc(),
                "read_by_user": payload.get("sender") == "user",
                "read_by_worker": payload.get("sender") == "worker",
            }
            if "image" in payload and payload["image"]:
                doc["image"] = payload["image"]
                
            insert_result = messages_col.insert_one(doc)
            doc["_id"] = insert_result.inserted_id
            
            serialized_doc = serialize_many([doc])[0]
            await manager.broadcast_to_thread(thread_id, serialized_doc)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, thread_id)
