import os
import pickle
import numpy as np
from datetime import datetime, timezone, timedelta
from collections import defaultdict

class SimpleAIModel:
    def __init__(self):
        self.user_stats_path = os.path.join(os.path.dirname(__file__), "simple_user_stats.pkl")
        self.user_stats = self.load_user_stats()
        self.data_cleanup_threshold = 1000  # Veri temizleme eşiği
        self.data_cleanup_percentage = 0.25  # Silinecek veri yüzdesi (%25)
    
    def load_user_stats(self):
        if os.path.exists(self.user_stats_path):
            try:
                with open(self.user_stats_path, "rb") as f:
                    return pickle.load(f)
            except:
                pass
        
        return defaultdict(self._create_user_data)
    
    def _create_user_data(self):
        return {
            'total_questions': 0,
            'correct_answers': 0,
            'subject_performance': defaultdict(self._create_performance_data),
            'topic_performance': defaultdict(self._create_performance_data),
            'difficulty_performance': defaultdict(self._create_performance_data),
            'recent_performance': [],
            'last_activity': None,
            'question_history': [],  # Soru geçmişini takip etmek için
            'last_cleanup_at': 0  # Son temizleme yapılan soru sayısı
        }
    
    def _create_performance_data(self):
        return {'total': 0, 'correct': 0}
    
    def save_user_stats(self):
        try:
            with open(self.user_stats_path, "wb") as f:
                pickle.dump(self.user_stats, f)
        except Exception as e:
            print(f"User stats kaydetme hatası: {e}")
            pass
    
    def cleanup_old_data(self, user_id):
        """Kullanıcı her 1000'in katına ulaştığında en eski %25 veriyi temizle"""
        user_data = self.user_stats[user_id]
        
        # Her 1000'in katında temizleme yap
        if user_data['total_questions'] > 0 and user_data['total_questions'] % self.data_cleanup_threshold == 0:
            # Son temizleme yapılan yerden farklı olmalı
            if user_data['last_cleanup_at'] != user_data['total_questions']:
                print(f"🧹 Veri temizleme başlatılıyor - Kullanıcı {user_id}: {user_data['total_questions']} soru (1000'in katı)")
                
                # En eski %25 soruyu temizle
                questions_to_remove = int(user_data['total_questions'] * self.data_cleanup_percentage)
                
                # Genel istatistikleri güncelle
                user_data['total_questions'] -= questions_to_remove
                
                # Doğru cevap sayısını orantılı olarak azalt
                # Bu yaklaşım genel başarı oranını korur
                overall_accuracy = user_data['correct_answers'] / (user_data['total_questions'] + questions_to_remove)
                user_data['correct_answers'] = int(user_data['total_questions'] * overall_accuracy)
                
                # Konu bazlı performansı güncelle
                for ders_id, subject_data in user_data['subject_performance'].items():
                    if subject_data['total'] > 0:
                        # Her konudan orantılı olarak veri çıkar
                        subject_accuracy = subject_data['correct'] / subject_data['total']
                        remove_from_subject = min(questions_to_remove // len(user_data['subject_performance']), subject_data['total'])
                        
                        subject_data['total'] -= remove_from_subject
                        subject_data['correct'] = int(subject_data['total'] * subject_accuracy)
                
                # Konu bazlı performansı güncelle
                for topic_key, topic_data in user_data['topic_performance'].items():
                    if topic_data['total'] > 0:
                        topic_accuracy = topic_data['correct'] / topic_data['total']
                        remove_from_topic = min(questions_to_remove // len(user_data['topic_performance']), topic_data['total'])
                        
                        topic_data['total'] -= remove_from_topic
                        topic_data['correct'] = int(topic_data['total'] * topic_accuracy)
                
                # Zorluk bazlı performansı güncelle
                for difficulty, diff_data in user_data['difficulty_performance'].items():
                    if diff_data['total'] > 0:
                        diff_accuracy = diff_data['correct'] / diff_data['total']
                        remove_from_diff = min(questions_to_remove // len(user_data['difficulty_performance']), diff_data['total'])
                        
                        diff_data['total'] -= remove_from_diff
                        diff_data['correct'] = int(diff_data['total'] * diff_accuracy)
                
                # Son performans listesini koru (en son 10 veri)
                if len(user_data['recent_performance']) > 10:
                    user_data['recent_performance'] = user_data['recent_performance'][-10:]
                
                # Son temizleme yapılan yeri kaydet
                user_data['last_cleanup_at'] = user_data['total_questions'] + questions_to_remove
                
                print(f"✅ Veri temizleme tamamlandı - Kullanıcı {user_id}: {user_data['total_questions']} soru kaldı")
                print(f"📊 Temizleme sonrası başarı oranı: %{user_data['correct_answers'] / user_data['total_questions'] * 100:.1f}")
                
                # Güncellenmiş verileri kaydet
                self.save_user_stats()
    
    def predict(self, X):
        user_id = X.get('user_id', 1)
        user_data = self.user_stats[user_id]
        
        difficulty = X.get('zorluk', 3)
        ders_id = X.get('ders_id', 1)
        konu_id = X.get('konu_id', 1)
        
        user_accuracy = 0.5
        if user_data['total_questions'] > 0:
            user_accuracy = user_data['correct_answers'] / user_data['total_questions']
        
        subject_accuracy = 0.5
        subject_data = user_data['subject_performance'][ders_id]
        if subject_data['total'] > 0:
            subject_accuracy = subject_data['correct'] / subject_data['total']
        
        topic_accuracy = 0.5
        topic_key = (ders_id, konu_id)
        topic_data = user_data['topic_performance'][topic_key]
        if topic_data['total'] > 0:
            topic_accuracy = topic_data['correct'] / topic_data['total']
        
        print(f"DEBUG AI Predict - User: {user_id}, Total: {user_data['total_questions']}, Correct: {user_data['correct_answers']}")
        print(f"DEBUG AI Predict - User Accuracy: {user_accuracy:.2f}, Subject: {subject_accuracy:.2f}, Topic: {topic_accuracy:.2f}")
        print(f"DEBUG AI Predict - Topic Key: {topic_key}, Topic Data: {topic_data}")
        
        difficulty_accuracy = 0.5
        difficulty_data = user_data['difficulty_performance'][difficulty]
        if difficulty_data['total'] > 0:
            difficulty_accuracy = difficulty_data['correct'] / difficulty_data['total']
        
        base_score = 0.5
        
        if difficulty <= 2:
            difficulty_factor = 0.3
        elif difficulty <= 4:
            difficulty_factor = 0.5
        else:
            difficulty_factor = 0.7
        
        performance_factor = (user_accuracy * 0.1 + subject_accuracy * 0.2 + topic_accuracy * 0.7)
        
        # Düzeltilmiş hesaplama: Performans faktörü ana etken olmalı
        score = performance_factor * 0.8 + (1 - difficulty_factor) * 0.2
        
        print(f"DEBUG AI Predict - Final Score: {score:.2f} ({score*100:.0f}%)")
        
        return max(0.0, min(1.0, score))
    
    def update(self, X, y):
        user_id = X.get('user_id', 1)
        user_data = self.user_stats[user_id]
        
        print(f"DEBUG AI Update - User: {user_id}, Correct: {y}, Before - Total: {user_data['total_questions']}, Correct: {user_data['correct_answers']}")
        
        user_data['total_questions'] += 1
        if y:
            user_data['correct_answers'] += 1
        
        ders_id = X.get('ders_id', 1)
        subject_data = user_data['subject_performance'][ders_id]
        subject_data['total'] += 1
        if y:
            subject_data['correct'] += 1
        
        konu_id = X.get('konu_id', 1)
        topic_key = (ders_id, konu_id)
        topic_data = user_data['topic_performance'][topic_key]
        topic_data['total'] += 1
        if y:
            topic_data['correct'] += 1
        
        difficulty = X.get('zorluk', 3)
        difficulty_data = user_data['difficulty_performance'][difficulty]
        difficulty_data['total'] += 1
        if y:
            difficulty_data['correct'] += 1
        
        user_data['recent_performance'].append(y)
        if len(user_data['recent_performance']) > 10:
            user_data['recent_performance'].pop(0)
        
        user_data['last_activity'] = datetime.now(timezone(timedelta(hours=3)))  # Türkiye saati
        
        print(f"DEBUG AI Update - After - Total: {user_data['total_questions']}, Correct: {user_data['correct_answers']}")
        
        # Veri temizleme kontrolü
        self.cleanup_old_data(user_id)
        
        self.save_user_stats()
    
    def get_user_insights(self, user_id):
        """Kullanıcı içgörüleri"""
        user_data = self.user_stats[user_id]
        
        if user_data['total_questions'] == 0:
            return {
                'message': 'Henüz soru çözülmemiş',
                'recommendations': ['İlk testinizi çözmeye başlayın!']
            }

        overall_accuracy = user_data['correct_answers'] / user_data['total_questions']
        
        best_subject = None
        best_accuracy = 0
        for ders_id, data in user_data['subject_performance'].items():
            if data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_subject = ders_id
        
        worst_subject = None
        worst_accuracy = 1
        for ders_id, data in user_data['subject_performance'].items():
            if data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy < worst_accuracy:
                    worst_accuracy = accuracy
                    worst_subject = ders_id
        
        recent_accuracy = 0
        if len(user_data['recent_performance']) > 0:
            recent_accuracy = sum(user_data['recent_performance']) / len(user_data['recent_performance'])
        
        insights = {
            'overall_accuracy': overall_accuracy,
            'total_questions': user_data['total_questions'],
            'best_subject': best_subject,
            'best_accuracy': best_accuracy,
            'worst_subject': worst_subject,
            'worst_accuracy': worst_accuracy,
            'recent_accuracy': recent_accuracy,
            'trend': 'improving' if recent_accuracy > overall_accuracy else 'declining' if recent_accuracy < overall_accuracy else 'stable'
        }
        
        return insights 