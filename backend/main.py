import socketio
from fastapi import FastAPI

from events import sio

api = FastAPI()


@api.get('/')
def health():
    return {'status': 'ok'}


app = socketio.ASGIApp(sio, other_asgi_app=api)
