#!/usr/bin/env python3
"""
PocketBuddy Backend API Testing Suite
Tests all backend endpoints for the Slovak AI assistant web app
"""

import requests
import sys
import json
from datetime import datetime

class PocketBuddyAPITester:
    def __init__(self, base_url="https://learndash-slovak.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - FAILED: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            return False, str(e)

    def test_seed_data(self):
        """Test seed data creation"""
        print("\n🌱 Testing seed data creation...")
        success, response = self.make_request('POST', 'seed', expected_status=200)
        
        if success:
            try:
                data = response.json()
                if 'admin_email' in data and 'admin_password' in data:
                    self.log_result("Seed Data Creation", True)
                    return True
                else:
                    self.log_result("Seed Data Creation", False, "Missing admin credentials in response")
            except:
                self.log_result("Seed Data Creation", False, "Invalid JSON response")
        else:
            # Check if data already exists
            if hasattr(response, 'json'):
                try:
                    data = response.json()
                    if 'Dáta už existujú' in data.get('message', ''):
                        self.log_result("Seed Data Creation", True, "Data already exists")
                        return True
                except:
                    pass
            self.log_result("Seed Data Creation", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing admin login...")
        login_data = {
            "email": "admin@pocketbuddy.sk",
            "password": "admin123"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        
        if success:
            try:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.token = data['token']
                    self.admin_user = data['user']
                    self.log_result("Admin Login", True)
                    return True
                else:
                    self.log_result("Admin Login", False, "Missing token or user in response")
            except:
                self.log_result("Admin Login", False, "Invalid JSON response")
        else:
            self.log_result("Admin Login", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_get_me(self):
        """Test get current user info"""
        print("\n👤 Testing get current user...")
        success, response = self.make_request('GET', 'auth/me', expected_status=200)
        
        if success:
            try:
                data = response.json()
                if data.get('role') == 'admin' and data.get('email') == 'admin@pocketbuddy.sk':
                    self.log_result("Get Current User", True)
                    return True
                else:
                    self.log_result("Get Current User", False, "Invalid user data")
            except:
                self.log_result("Get Current User", False, "Invalid JSON response")
        else:
            self.log_result("Get Current User", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_admin_statistics(self):
        """Test admin statistics endpoint"""
        print("\n📊 Testing admin statistics...")
        success, response = self.make_request('GET', 'admin/statistics', expected_status=200)
        
        if success:
            try:
                data = response.json()
                required_fields = ['total_users', 'students', 'teachers', 'pending_requests', 'total_sources', 'total_chats']
                if all(field in data for field in required_fields):
                    self.log_result("Admin Statistics", True)
                    print(f"   📈 Stats: {data}")
                    return True
                else:
                    self.log_result("Admin Statistics", False, "Missing required fields")
            except:
                self.log_result("Admin Statistics", False, "Invalid JSON response")
        else:
            self.log_result("Admin Statistics", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        return False

    def test_grades_management(self):
        """Test grades CRUD operations"""
        print("\n🎓 Testing grades management...")
        
        # Get grades
        success, response = self.make_request('GET', 'grades', expected_status=200)
        if success:
            try:
                grades = response.json()
                if isinstance(grades, list) and len(grades) > 0:
                    self.log_result("Get Grades", True)
                    print(f"   📚 Found {len(grades)} grades")
                else:
                    self.log_result("Get Grades", False, "No grades found")
            except:
                self.log_result("Get Grades", False, "Invalid JSON response")
        else:
            self.log_result("Get Grades", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_subjects_management(self):
        """Test subjects CRUD operations"""
        print("\n📖 Testing subjects management...")
        
        # Get subjects
        success, response = self.make_request('GET', 'subjects', expected_status=200)
        if success:
            try:
                subjects = response.json()
                if isinstance(subjects, list) and len(subjects) > 0:
                    self.log_result("Get Subjects", True)
                    print(f"   📝 Found {len(subjects)} subjects")
                    
                    # Test creating a new subject
                    new_subject = {
                        "name": "Test Predmet",
                        "description": "Test description"
                    }
                    success, response = self.make_request('POST', 'subjects', new_subject, expected_status=200)
                    if success:
                        self.log_result("Create Subject", True)
                    else:
                        self.log_result("Create Subject", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
                else:
                    self.log_result("Get Subjects", False, "No subjects found")
            except:
                self.log_result("Get Subjects", False, "Invalid JSON response")
        else:
            self.log_result("Get Subjects", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_users_management(self):
        """Test users management"""
        print("\n👥 Testing users management...")
        
        # Get all users
        success, response = self.make_request('GET', 'admin/users', expected_status=200)
        if success:
            try:
                users = response.json()
                if isinstance(users, list) and len(users) > 0:
                    self.log_result("Get All Users", True)
                    print(f"   👤 Found {len(users)} users")
                else:
                    self.log_result("Get All Users", False, "No users found")
            except:
                self.log_result("Get All Users", False, "Invalid JSON response")
        else:
            self.log_result("Get All Users", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_registration_requests(self):
        """Test registration requests"""
        print("\n📋 Testing registration requests...")
        
        success, response = self.make_request('GET', 'admin/registration-requests', expected_status=200)
        if success:
            try:
                requests_data = response.json()
                if isinstance(requests_data, list):
                    self.log_result("Get Registration Requests", True)
                    print(f"   📝 Found {len(requests_data)} pending requests")
                else:
                    self.log_result("Get Registration Requests", False, "Invalid response format")
            except:
                self.log_result("Get Registration Requests", False, "Invalid JSON response")
        else:
            self.log_result("Get Registration Requests", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_ai_sources(self):
        """Test AI sources management"""
        print("\n🤖 Testing AI sources...")
        
        success, response = self.make_request('GET', 'ai-sources', expected_status=200)
        if success:
            try:
                sources = response.json()
                if isinstance(sources, list):
                    self.log_result("Get AI Sources", True)
                    print(f"   📁 Found {len(sources)} AI sources")
                else:
                    self.log_result("Get AI Sources", False, "Invalid response format")
            except:
                self.log_result("Get AI Sources", False, "Invalid JSON response")
        else:
            self.log_result("Get AI Sources", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_chat_functionality(self):
        """Test chat functionality"""
        print("\n💬 Testing chat functionality...")
        
        # Get chats
        success, response = self.make_request('GET', 'chats', expected_status=200)
        if success:
            try:
                chats = response.json()
                if isinstance(chats, list):
                    self.log_result("Get Chats", True)
                    print(f"   💭 Found {len(chats)} chats")
                    
                    # Create new chat
                    new_chat = {"title": "Test Chat"}
                    success, response = self.make_request('POST', 'chats', new_chat, expected_status=200)
                    if success:
                        try:
                            chat_data = response.json()
                            chat_id = chat_data.get('id')
                            if chat_id:
                                self.log_result("Create Chat", True)
                                
                                # Test sending message
                                message_data = {"content": "Ahoj, ako sa máš?"}
                                success, response = self.make_request('POST', f'chats/{chat_id}/messages', message_data, expected_status=200)
                                if success:
                                    self.log_result("Send Message", True)
                                    print("   🤖 AI response received successfully")
                                else:
                                    self.log_result("Send Message", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
                            else:
                                self.log_result("Create Chat", False, "No chat ID in response")
                        except:
                            self.log_result("Create Chat", False, "Invalid JSON response")
                    else:
                        self.log_result("Create Chat", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
                else:
                    self.log_result("Get Chats", False, "Invalid response format")
            except:
                self.log_result("Get Chats", False, "Invalid JSON response")
        else:
            self.log_result("Get Chats", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting PocketBuddy Backend API Tests")
        print("=" * 50)
        
        # Test seed data first
        if not self.test_seed_data():
            print("⚠️  Seed data creation failed, but continuing with tests...")
        
        # Test admin login
        if not self.test_admin_login():
            print("❌ Admin login failed - cannot continue with authenticated tests")
            return False
        
        # Run authenticated tests
        self.test_get_me()
        self.test_admin_statistics()
        self.test_grades_management()
        self.test_subjects_management()
        self.test_users_management()
        self.test_registration_requests()
        self.test_ai_sources()
        self.test_chat_functionality()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = PocketBuddyAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())