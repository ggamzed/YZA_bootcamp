import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.app.ml_model import PracticeModel

model = PracticeModel()

for i in range(30):
    X = {"ders_id": 1, "konu_id": i % 3, "zorluk": (i % 5) + 1}
    y = i % 2
    model.update(X, y)

print("Simülasyon tamamlandı.")
