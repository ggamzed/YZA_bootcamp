import os
import pickle
from river import linear_model
from river import preprocessing

class PracticeModel:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "model.pkl")

        if os.path.exists(self.model_path):
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
        else:

            self.model = preprocessing.StandardScaler() | linear_model.LogisticRegression()

    def predict(self, X):

        return self.model.predict_proba_one(X)

    def update(self, X, y):
        self.model.learn_one(X, y)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)
