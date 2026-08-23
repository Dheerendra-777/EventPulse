# EventPulse

> One Connected Platform for Real-Time Event Management

## 🏆 CODEWARS HACKATHON --- 24 HOURS

-   **Team:** Webmaster
-   **Team ID:** 23
-   **Institution:** Rama University, Kanpur Mandhana
-   **Team Leader:** Dheerendra Kashyap --- Webmaster, Full-Stack
    Developer
-   **Team Member:** Virendra Kashyap --- Management, Marketing
-   **Organizer:** Hacker's Unity
-   **Venue:** Arya College of Engineering & I.T., Jaipur
-   **Dates:** 22--23 August 2026

## 🎯 Problem

The CodeWars problem statement calls for a real-time event engagement
and communication platform where organizers can share announcements and
schedule updates, while participants can communicate with mentors, raise
support requests, ask questions, and receive timely updates.

## 💡 Solution

EventPulse connects **Admins, Organizers, Mentors and Participants**
through one event-management ecosystem available through the web
platform and Android application.

``` text
Users
  ↓
Web + Android
  ↓
Authentication / Role Verification
  ↓
REST API
  ↓
Cloud Data
  ↓
Synchronization
```

## ✨ Core Features

-   Role-based access for Admin, Organizer, Mentor and Participant
-   Event overview and management
-   Participant management
-   Schedules
-   Announcements
-   Mentor support
-   Support/help requests
-   Protected dashboards
-   Google authentication / OAuth
-   Email/password authentication
-   JWT bearer authentication
-   Web + Android access
-   Android offline cache and synchronization

## 👥 Role Workspaces

### Admin

Overview · Participants · Organizers · Mentors · Events · Announcements
· Reports · Settings

### Organizer

Event Overview · Participants · Schedule · Announcements · Support
Requests · Settings

### Mentor

My Participants · Assigned Requests · Announcements · Schedule · Profile

### Participant

My Event · Schedule · Announcements · My Mentor · Support / Help ·
Profile

## 🧰 Technology Stack

### Web

-   React
-   JavaScript / JSX
-   HTML5
-   CSS3
-   Responsive UI

### Authentication & Security

-   Google OAuth / Google Sign-In
-   Email/password authentication
-   JWT bearer authentication
-   Role-based authorization
-   Protected routes
-   Session/token handling

### Backend

-   REST API
-   JSON-based API communication
-   Production deployment on Render

### Data & Sync

-   Firebase Authentication / Firestore integration
-   Cloud synchronization
-   Android Room local database
-   Offline cache
-   Two-way synchronization architecture

### Android

-   Kotlin
-   Android SDK
-   Room Database
-   REST API integration
-   Background/on-demand synchronization

### Development

-   Git / GitHub
-   Google AI Studio
-   Gradle / Android build tooling
-   Render

## 🔐 Authentication Flow

``` text
User
 ↓
Choose Role
 ↓
Email + Password OR Google OAuth
 ↓
Authentication
 ↓
Session / JWT
 ↓
Role Verification
 ↓
Protected Workspace
```

## 🔄 Web + Android Synchronization

``` text
             Production REST API
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
     EventPulse Web      EventPulse Android
                              │
                              ↓
                         Room Cache
                              │
                              ↓
                         Sync Layer
```

The Android application uses a local Room cache while communicating with
the production backend. The architecture supports server-backed data
synchronization and offline-aware usage.

## 🧪 Testing

The project was verified across:

-   Authentication
-   Role-based navigation
-   Protected routes
-   Backend API connectivity
-   JWT bearer authentication
-   DTO/entity transformations
-   Android unit/integration tests
-   Data synchronization
-   Offline/local cache behavior
-   Production API verification
-   Android build and APK generation

## 🌐 Deployment

**Production backend:** https://eventpulse-5vqd.onrender.com/

## 🏗️ High-Level Architecture

``` text
                  USERS
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
      WEB CLIENT          ANDROID APP
                              │
                         ROOM CACHE
          │                   │
          └─────────┬─────────┘
                    ↓
                REST API
                    ↓
          Authentication + Roles
                    ↓
               Business Logic
                    ↓
                Cloud Data
                    ↓
             Synchronization
```

## 🚀 Demo Flow

``` text
Landing Page
 ↓
Login
 ↓
Google Authentication
 ↓
Role-based Dashboard
 ↓
Event / Participant Information
 ↓
Announcements
 ↓
Support Request
 ↓
Mentor Workflow
 ↓
Android Application
 ↓
Connected Data / Sync
 ↓
Architecture & Future Scope
```

## 🌟 Innovation Highlights

1.  **One connected ecosystem** instead of disconnected event tools.
2.  **Role-aware experience** for every stakeholder.
3.  **Web + Android continuity** using the same backend.
4.  **Offline-aware Android architecture** with local Room caching.
5.  **Centralized communication and support** for events.

## 🔮 Future Scope

-   Push notifications
-   Real-time chat
-   AI event assistant
-   Smart mentor matching
-   AI support-ticket classification
-   Live analytics
-   QR event check-in
-   Automated certificates
-   Event recommendations
-   WebSocket-based live updates

## 👨‍💻 Team

### Dheerendra Kashyap

**Team Leader · Webmaster · Full-Stack Developer**

Technical lead responsible for the product architecture, web platform,
integration and implementation.

### Virendra Kashyap

**Management · Marketing**

Responsible for project management, coordination, presentation support
and marketing direction.

## 🏁 Project Summary

**EventPulse** is a connected event-management ecosystem designed to
make technology events easier to organize, easier to participate in, and
easier to support.

> **Organize Better. Engage Faster. Resolve Smarter.**

## 🔒 Security Note

Never commit API keys, OAuth secrets, Firebase service credentials,
Android signing keys, passwords or other sensitive configuration to
GitHub. Use environment variables and secure deployment configuration.

------------------------------------------------------------------------

*Prepared for the CodeWars Hackathon 2026 --- Team Webmaster, Team ID
23.*
