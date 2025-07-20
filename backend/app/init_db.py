from backend.app.database import Base, engine

Base.metadata.create_all(bind=engine)
print("Tablolar başarıyla oluşturuldu.")
