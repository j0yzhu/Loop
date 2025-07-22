<h1 align="center">LOOP</h1>
<p align="center">
  <strong>Project by Team 6: Byte-Sized Cuties</strong>
</p>
<hr/>

## 🛠️ Project Management Tool:
We used Discord for communication and [Github Project/Issues](https://github.com/uoa-compsci399-2025-s1/capstone-project-2025-s1-team-6/issues) for task tracking.

## 📱 About:
LOOP is a social media platform designed for neuro-diverse students at the University of Auckland. Loop was coined as a solution to a problem most people would never consider. Through our conducted research, we determined that common social media platforms today are too over-stimulating, cluttered, and messy for users with neurodiversity. To solve this problem, we propose LOOP - a social media platformed designed with inclusivity at its forefront, to be accomodating for all neurodiverse users to post, share common interests, and connect with each other in a non-confrontational manner.

## 🧰 Technical Stack & Dependencies:
### Frontend:
- React Native
- Node (v22.14.0)
- TypeScript
- NativeWind
- Expo Go

Note: Check package.json for libraries and their versions

### Backend:
- Python 
- Flask (3.1.0)
- Peewee
- PostgreSQL

Note: Check requirements.txt for libraries and their versions

## 🚀 Setting up the Project:
### 📲 Step 1: Install Expo Go
Download Expo Go from the App Store or Play Store on your mobile device.

### 📦 Step 2: Install Dependencies
From the root directory, change directory to ```./frontend/loop```.

Run the following command:
```bash
npm install
```

### 🛠️ Step 3: Configure Environment:
In ```./frontend/loop``` make a .env file and paste the following in:
```text
EXPO_PUBLIC_API_URL=http://loop-lb-1526404142.ap-southeast-2.elb.amazonaws.com
```

### ▶️ Step 4: Run the App:
```bash
npx expo start
```
Scan the QR code that appears in your terminal using Expo Go on your mobile device.


## 🎬 Usage Example:
[Loop Demo Video](https://uoa-my.sharepoint.com/:v:/r/personal/gche678_uoa_auckland_ac_nz/Documents/COMPSCI399/Final%20Presentation/Team6DemoVid.mov?csf=1&web=1&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=eY1NFu)

## 🔮 Future Plans:

### **Expand Beyond UoA:**
  - Extend Loop to other universities across Aotearoa 
  - Implement scalable, non-UoA specific authentication 
  - Establish moderation strategies to preserve safety and inclusivity


### **Integration with Support Services:**
  - Optional connection to Inclusive Learning, and other relvant support services


### **Gamification:** 
- Loop has the potential to foster ongoing, positive user engagement through gamified elements. 
  Future features could include:
  - Participation badges 
  - Community milestones
  - Engagement streaks
- These mechanisms could help foster a sense of belonging and encouragement, especially for users who might be hesitant 
  to engage at first.


### **Backend Improvements:**
- **Security:** 
    - Add Multi-Factor Authentication (MFA) to enhance account protection.
    - Implement email verification to ensure valid and trusted user accounts.


- **Notification:** Enable push or in-app notifications for:
    - New messages
    - Event updates and reminder for users rsvp'd events
    - Announcements
    

  - **Image/media sharing:** Expand messaging functionality to include:
    - Image sharing
    - Video sharing

- **Expand Accessibility Features:**
  - While Loop already supports several accessibility features such as dark/light 
  mode for visual comfort and a session timer to aid time awareness (particularly helpful for users with ADHD) there is
  strong potential to go further. Future improvements could include text-to-speech functionality, custom font selection, 
  and dynamic text scaling to better support diverse reading and communication needs.
  


## 🤝 Acknowledgements:
- UoA Inclusive Learning Team
- Inclusive Learning participants that took part in our app survey
- [Flask Documentation](https://flask.palletsprojects.com/en/stable/)
- [Flask-RESTX Documentation](https://flask-restx.readthedocs.io/en/latest/)
- [Peewee Documentation](https://docs.peewee-orm.com/en/latest/)
- [Docker Documentation](https://docs.docker.com/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Native Components](https://rnr-docs.vercel.app/components/button/ )
- [ChatGPT](https://chatgpt.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [AWS Documentation](https://docs.aws.amazon.com/)

## 👩‍💻👨‍💻  Contributors:
- Azzarina Azizi: Fullstack (Messaging)

- Grace Chen: Fullstack (Profile Set up)

- Siqi Lai: Fullstack (Community Page)

- Areesh Patni: Fullstack (Community Page)

- Parmida Raeis: Fullstack (Profile)

- Joy Zhu: Team Lead, Cloud, Fullstack (Registration/Sign in & Homepage)
