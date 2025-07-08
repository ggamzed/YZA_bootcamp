from sqlalchemy import Column, Integer, String,Boolean,ForeignKey
from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    role =  Column(String)
    hashed_password = Column(String)
    first_test_done = Column(Boolean, default=False)#kullanıcı ilk kayıt oldugunda modelin eğitilmediğini bildirmek için-seyfi
    first_test_counter = Column(Integer, default=0)#ilk 10 test sayısı

class Questions(Base):
    __tablename__="questions"
    soru_id =Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey('users.id'))
    ders_id= Column(Integer)
    konu_id= Column(Integer)
    tags = Column(String)
    zorluk= Column(Integer)
    is_correct= Column(Integer,default=0)
