import os
import pickle

from river import compose, linear_model
from river.preprocessing import StandardScaler, OneHotEncoder, FeatureHasher

class PracticeModel:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "model.pkl")

        if os.path.exists(self.model_path):
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
        else:
            num_features = ['zorluk']
            low_card_cats = ['ders_id', 'konu_id', 'altbaslik_id']
            high_card_cats = ['user_id']

            num_pipeline = compose.Select(*num_features) | StandardScaler()

            onehot_pipeline = compose.Select(*low_card_cats) | OneHotEncoder()

            hashing_pipeline = compose.Select(*high_card_cats) | FeatureHasher(n_features=2**10)

            feature_pipeline = compose.TransformerUnion(
                num_pipeline,
                onehot_pipeline,
                hashing_pipeline
            )

            self.model = feature_pipeline | linear_model.LogisticRegression()

    def predict(self, X):
        """
        X: dict, örn:
        {'ders_id': ..., 'konu_id': ..., 'altbaslik_id': ..., 'zorluk': ..., 'user_id': ...}
        """
        return self.model.predict_proba_one(X)

    def update(self, X, y):
        self.model.learn_one(X, y)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)
