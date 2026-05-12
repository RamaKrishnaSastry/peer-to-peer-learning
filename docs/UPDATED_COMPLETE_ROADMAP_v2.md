# UPDATED Complete Implementation Roadmap (v2.0)
## After Critical Design Decisions

---

## EXECUTIVE SUMMARY

This document is the UPDATED roadmap incorporating:
1. ✅ 4-level category hierarchy (not 3)
2. ✅ User video uploads via YouTube (users upload to YouTube, we embed)
3. ✅ Hybrid rating system (upvotes + negative signals)
4. ✅ AI verification moved to Phase 1 (not Phase 3)
5. ✅ Group creator verification (5 uploads, 20 upvotes minimum)

**Timeline: Still 4 weeks MVP, but Phase 1 is more feature-rich**

---

## TABLE OF CONTENTS

1. Updated Architecture
2. Updated Phase 1 (Weeks 1-4)
3. Updated Phase 2 (Weeks 5-8)
4. Updated Phase 3 (Weeks 9-12)
5. Updated Database Schema
6. Updated API Reference
7. Implementation Checklist

---

## PART 1: UPDATED ARCHITECTURE

### Platform Stack (Unchanged)

**Frontend:** React 18 + TypeScript, Tailwind, React Query
**Backend:** Node.js + Express + TypeScript, Prisma
**Database:** PostgreSQL 14+
**APIs:** Claude (verification), YouTube (embedding)
**Hosting:** Vercel (frontend), Railway (backend)

### Information Architecture (UPDATED)

```
PEER LEARNING PLATFORM v2.0
├─────────────────────────────────────────────┐
│                                             │
│ LAYER 1: AUTHENTICATION & USER MGMT         │
│  ├── Signup/Login                          │
│  ├── User Profiles                         │
│  ├── Reputation Scores                     │
│  └── Group Creator Verification            │
│                                             │
│ LAYER 2: CONTENT ORGANIZATION (4-LEVEL)     │
│  ├── Level 0: Domain (UPSC, JEE, Finance)  │
│  ├── Level 1: Subject (Polity, Physics)    │
│  ├── Level 2: Topic (Governance, Mechanics)│
│  └── Level 3: Sub-topic (Governor, CM)     │
│                                             │
│ LAYER 3: CORE FEATURES                      │
│  ├── Content (YouTube + Notes)             │
│  ├── Comments on Content                    │
│  ├── Daily Questions + AI Verification      │
│  ├── Discussions (Q&A)                      │
│  └── Answers with Feedback                  │
│                                             │
│ LAYER 4: ENGAGEMENT DRIVERS                 │
│  ├── Streaks                               │
│  ├── Leaderboards                          │
│  ├── Badges                                │
│  ├── Notifications                         │
│  └── Ratings System (Hybrid)               │
│                                             │
│ LAYER 5: COMMUNITY                          │
│  ├── Study Groups                          │
│  ├── Group Leaderboards                    │
│  ├── Group Verification                    │
│  └── Peer Feedback                         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## PART 2: UPDATED PHASE 1 - MVP (Weeks 1-4)
### Goal: Complete, production-ready platform with AI verification

**Key Changes from Original:**
- AI verification NOW (not Phase 3)
- 4-level categories (not 3)
- User video uploads (YouTube)
- Group creator verification
- Hybrid rating system

---

### FEATURE 1.1: Authentication (UNCHANGED)

See COMPLETE_IMPLEMENTATION_ROADMAP.md for details.

---

### FEATURE 1.2: 4-Level Category Hierarchy (UPDATED)

**What:** Hierarchical organization of topics with 4 levels

**New Structure:**

```
UPSC (Level 0: Domain)
├── General Studies 1 (Level 1: Subject)
│   ├── History & Culture (Level 2: Topic)
│   │   ├── Ancient India (Level 3: Sub-topic)
│   │   ├── Medieval India (Level 3)
│   │   └── Modern India (Level 3)
│   ├── Geography (Level 2: Topic)
│   │   ├── Physical Geography (Level 3)
│   │   ├── Human Geography (Level 3)
│   │   └── Indian Geography (Level 3)
│   └── Art & Culture (Level 2: Topic)
│       ├── Classical Arts (Level 3)
│       └── Heritage Sites (Level 3)
│
├── General Studies 2 (Level 1: Subject)
│   ├── Polity & Constitution (Level 2: Topic)
│   │   ├── Constitution Basics (Level 3)
│   │   ├── Governance Systems (Level 3)
│   │   │   ├── Governor (Level 4 - Optional)
│   │   │   ├── Chief Minister (Level 4)
│   │   │   └── Parliament (Level 4)
│   │   ├── Electoral Process (Level 3)
│   │   └── Rights & Duties (Level 3)
│   └── International Relations (Level 2: Topic)
│       ├── UN & Multilateral Bodies (Level 3)
│       └── Regional Organizations (Level 3)
│
├── General Studies 3 (Level 1: Subject)
├── General Studies 4 (Level 1: Subject)
└── Optional Subjects (Level 1: Subject)

JEE (Level 0: Domain)
├── Physics (Level 1: Subject)
│   ├── Mechanics (Level 2: Topic)
│   │   ├── Kinematics (Level 3)
│   │   ├── Dynamics (Level 3)
│   │   ├── Circular Motion (Level 3)
│   │   ├── Gravitation (Level 3)
│   │   └── Energy & Work (Level 3)
│   ├── Thermodynamics (Level 2: Topic)
│   ├── Waves & Oscillations (Level 2: Topic)
│   └── Optics (Level 2: Topic)
│
├── Chemistry (Level 1: Subject)
│   ├── Physical Chemistry (Level 2: Topic)
│   ├── Organic Chemistry (Level 2: Topic)
│   └── Inorganic Chemistry (Level 2: Topic)
│
└── Mathematics (Level 1: Subject)
    ├── Algebra (Level 2: Topic)
    ├── Calculus (Level 2: Topic)
    ├── Geometry & Trigonometry (Level 2: Topic)
    └── Vectors & 3D (Level 2: Topic)

Finance (Level 0: Domain)
├── Stock Market Basics (Level 1: Subject)
│   ├── What are Stocks (Level 2: Topic)
│   ├── How Markets Work (Level 2: Topic)
│   └── Trading Mechanics (Level 2: Topic)
├── Fundamental Analysis (Level 1: Subject)
├── Technical Analysis (Level 1: Subject)
└── Personal Finance (Level 1: Subject)
```

**Database Schema (UPDATED):**

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(500),
  parent_id INT REFERENCES categories(id),
  domain VARCHAR(50) NOT NULL, -- 'UPSC', 'JEE', 'Finance'
  level INT, -- 0: Domain, 1: Subject, 2: Topic, 3: Sub-topic
  path VARCHAR(500), -- "UPSC/GS2/Polity/Governor"
  icon VARCHAR(50),
  order_position INT,
  is_leaf BOOLEAN DEFAULT false, -- True if no children
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example inserts:
INSERT INTO categories (name, slug, domain, level, path, is_leaf) VALUES
  ('UPSC', 'upsc', 'UPSC', 0, 'UPSC', false),
  ('General Studies 1', 'gs1', 'UPSC', 1, 'UPSC/GS1', false),
  ('History & Culture', 'history-culture', 'UPSC', 2, 'UPSC/GS1/History', false),
  ('Ancient India', 'ancient-india', 'UPSC', 3, 'UPSC/GS1/History/Ancient', true);
```

**API Endpoints (UPDATED):**

```
GET /api/categories
  Response: All root domains (UPSC, JEE, Finance)

GET /api/categories/:slug
  Response: Category with immediate children
  Example: /api/categories/upsc → Shows GS1, GS2, etc

GET /api/categories/:slug/full-tree
  Response: Full tree from this level to leaves
  Example: /api/categories/polity → Shows all subcategories

GET /api/categories/:id/breadcrumb
  Response: Path from root to this category
  Example: Shows "UPSC > GS2 > Polity > Governance"

GET /api/categories/:id/children
  Response: Immediate children only

GET /api/categories/:id/content
  Query: ?limit=20&offset=0&sort=rating
  Response: Content in this category (leaf only)
```

**Frontend Changes:**

```typescript
// 1. Enhanced Category Browser: /components/CategoryBrowser.tsx
//    - Drill-down from Domain → Subject → Topic → Sub-topic
//    - Breadcrumb navigation
//    - "Back" button at each level
//    - Show content count at each level

// 2. Breadcrumb Component: /components/Breadcrumb.tsx
//    - Shows full path
//    - Clickable links
//    - Shows current level (bold)

// 3. Content View by Category:
//    - Only show if is_leaf = true
//    - Prevent showing content at non-leaf levels
```

**Implementation Steps:**

1. Create categories table with level column
2. Seed UPSC, JEE, Finance with 4-level hierarchies (150+ categories)
3. Add is_leaf column
4. Build enhanced GET endpoints
5. Create breadcrumb component
6. Create drill-down category browser
7. Test navigation through all levels

---

### FEATURE 1.3: Content Upload (YouTube + Notes) (UPDATED)

**What:** Users upload content via YouTube link OR PDF notes

**Key Change:** Users can upload videos WITHOUT hosting them

**How It Works:**

```
Content Upload Flow (Updated):

Case 1: YouTube Video
├── User uploads to YouTube (private/unlisted)
├── Copies unlisted share link
├── Pastes link in our platform
├── We validate YouTube URL
├── We fetch thumbnail & title (if available)
├── We embed video on our platform
├── YouTube handles all hosting/streaming

Case 2: Notes (PDF/Text)
├── User uploads PDF or text file
├── We validate file type & size
├── We store on Cloudinary (or as text)
├── File searchable & downloadable by others

Both:
├── Add to category (4-level drill-down to leaf)
├── Add title, description, tags
├── Get immediate feedback on upload
└── Editable within 24h
```

**Database Schema (UPDATED):**

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000),
  type VARCHAR(50) NOT NULL, -- 'youtube_video' or 'pdf_notes' or 'text_notes'
  url VARCHAR(500) NOT NULL, -- YouTube URL or file path
  thumbnail VARCHAR(500),
  file_size INT, -- Size in bytes for notes
  version INT DEFAULT 1,
  creator_id UUID NOT NULL REFERENCES users(id),
  category_id INT NOT NULL REFERENCES categories(id),
  
  -- Rating System (Hybrid - Updated)
  avg_rating DECIMAL(3,2) DEFAULT 0.0,
  total_upvotes INT DEFAULT 0,
  total_downvotes INT DEFAULT 0, -- NEW: For net voting
  net_rating INT DEFAULT 0, -- upvotes - downvotes
  accuracy_rate DECIMAL(3,2) DEFAULT 0.0,
  
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints (UPDATED):**

```
POST /api/content/upload
  Headers: Authorization: Bearer <token>
  Body: {
    title: string,
    description: string,
    type: 'youtube_video' | 'pdf_notes' | 'text_notes',
    url: string (YouTube URL),
    category_id: number (leaf category only)
  }
  Validation:
    - URL must be valid YouTube URL
    - URL must be unlisted (not public)
    - Category must have is_leaf = true
    - File size < 10MB (for notes)
  Response: { success, content }

GET /api/content/:id
  Response: Content with creator info, ratings, comments, accuracy

POST /api/content/:id/rate
  Headers: Authorization: Bearer <token>
  Body: { rating: 'upvote' | 'downvote' | 'clear' }
  Response: { success, new_net_rating, new_avg_rating }

DELETE /api/content/:id
  Headers: Authorization: Bearer <token>
  (Only creator within 24h)
```

**Frontend Implementation (UPDATED):**

```typescript
// 1. Upload Form: /pages/UploadContent.tsx
//    - Category selector (4-level drill-down to leaf only)
//    - Title & description input
//    - Video URL input with validation:
//      - Check if YouTube URL
//      - Extract video ID
//      - Preview thumbnail
//      - Warn if video is public (should be unlisted)
//    - Notes file upload
//    - Submit button

// 2. Content Card: /components/ContentCard.tsx
//    - Shows upvote/downvote buttons
//    - Shows net rating
//    - Shows creator

// 3. Content Detail: /pages/ContentDetail.tsx
//    - Embedded YouTube video (if video)
//    - Text display (if notes)
//    - Upvote/downvote buttons
//    - Shows rating breakdown:
//      - Upvotes: 234
//      - Downvotes: 12
//      - Net: +222
```

**Hybrid Rating System (NEW):**

```
User can vote: Upvote, Downvote, or Clear vote

Display:
├── "👍 234 👎 12" = Net +222
├── Percentage helpful: 95%
└── Color coded: Green (helpful), Red (unhelpful)

Affects:
├── Content ranking (net votes higher = better rank)
├── Creator reputation (too many downvotes = red flag)
├── Content visibility (heavily downvoted = not recommended)
```

**Implementation Steps:**

1. Update content table with upvotes/downvotes
2. Build YouTube URL validation
3. Create upload form with category drill-down
4. Build thumbnail extraction from YouTube
5. Create content card with up/downvote
6. Add voting logic
7. Test YouTube embedding
8. Test PDF upload

---

### FEATURE 1.4: Comments on Content (UNCHANGED)

See COMPLETE_IMPLEMENTATION_ROADMAP.md - no changes.

---

### FEATURE 1.5: Daily Questions + AI Verification (MOVED TO PHASE 1) ⭐

**What:** System publishes one question per day with IMMEDIATE AI verification

**Why Moved to Phase 1:**
- Cost negligible (~$0.01/answer)
- Critical for UPSC Prelims (100% MCQ)
- Builds trust from day 1
- Simple to implement

**Database Schema (UPDATED):**

```sql
CREATE TABLE daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_type VARCHAR(50), -- 'upsc_prelims', 'jee_physics', 'jee_math'
  category_id INT REFERENCES categories(id),
  question_text VARCHAR(2000) NOT NULL,
  difficulty VARCHAR(50), -- 'easy', 'medium', 'hard'
  
  -- For MCQ only (UPSC Prelims, some JEE)
  option_a VARCHAR(500),
  option_b VARCHAR(500),
  option_c VARCHAR(500),
  option_d VARCHAR(500),
  correct_option VARCHAR(1), -- A, B, C, or D
  
  explanation VARCHAR(5000),
  source VARCHAR(255), -- 'PYQ 2023', 'UPSC 2022'
  
  publish_date DATE NOT NULL,
  deadline TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES daily_questions(id),
  user_id UUID REFERENCES users(id),
  answer_text VARCHAR(2000) NOT NULL, -- The option chosen (A/B/C/D)
  
  -- AI Verification (NEW - Happens immediately)
  is_correct BOOLEAN,
  ai_verified BOOLEAN DEFAULT true,
  ai_verdict VARCHAR(50), -- For future: 'CORRECT', 'PARTIAL', 'INCORRECT'
  ai_confidence DECIMAL(3,2),
  verified_at TIMESTAMP,
  
  rank INT, -- Rank among all submissions
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

CREATE TABLE daily_question_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES daily_questions(id),
  total_attempts INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  success_rate DECIMAL(3,2),
  option_a_count INT,
  option_b_count INT,
  option_c_count INT,
  option_d_count INT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**AI Verification Logic (NEW):**

```typescript
// When answer submitted, immediately verify
async function submitDailyQuestion(
  questionId: string, 
  userId: string, 
  answer: string
) {
  // 1. Save submission
  const submission = await createSubmission({
    questionId,
    userId,
    answerText: answer,
  });

  // 2. For MCQ, verify immediately
  const question = await getQuestion(questionId);
  if (question.type === 'upsc_prelims' || question.type === 'jee_mcq') {
    const isCorrect = answer.toUpperCase() === question.correct_option;
    
    // 3. Use Claude to EXPLAIN the answer
    const explanation = await claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Question: "${question.question_text}"
          
Options:
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}

The correct answer is: ${question.correct_option}

Briefly explain why this is correct and why others are wrong.`,
        },
      ],
    });

    // 4. Update submission with verdict
    await updateSubmission(submission.id, {
      isCorrect,
      aiVerified: true,
      aiVerdict: isCorrect ? 'CORRECT' : 'INCORRECT',
      aiConfidence: 0.99, // For MCQ, certainty is high
      verifiedAt: new Date(),
    });

    // 5. Update user stats
    if (isCorrect) {
      await incrementDailyStreak(userId);
    }
  }

  return { success: true, isCorrect };
}
```

**For Non-MCQ (JEE Problems):**

```
Phase 1: Manual verification
├── Accept solution text/image
├── Show peer solutions
├── Don't auto-verify yet
└── Flag for Phase 2 AI analysis

Phase 2: Extended AI verification
├── Analyze solution approach
├── Check calculation steps
├── Compare with known solutions
└── Provide feedback
```

**API Endpoints (UPDATED):**

```
GET /api/daily-questions/today/:type
  Response: Today's question
  Example: /api/daily-questions/today/upsc_prelims

POST /api/daily-questions/:id/submit
  Headers: Authorization: Bearer <token>
  Body: { answer: 'A' | 'B' | 'C' | 'D' }
  Response: {
    success: true,
    is_correct: true,
    verdict: 'CORRECT',
    explanation: 'This is correct because...',
    rank: 234 // among all submissions
  }

GET /api/daily-questions/:id/leaderboard
  Response: Top 100 submissions with ranks

GET /api/daily-questions/:id/stats
  Response: {
    total_attempts: 1234,
    success_rate: 0.45,
    option_distribution: { A: 300, B: 200, C: 500, D: 234 }
  }

GET /api/daily-questions/history/:type
  Query: ?limit=30 (past 30 questions)
  Response: Previous questions with stats
```

**Frontend Implementation (UPDATED):**

```typescript
// 1. Daily Question Widget: /components/DailyQuestionWidget.tsx
//    - Shows today's question (if MCQ)
//    - Shows 4 options as buttons
//    - On click: Submit and show result IMMEDIATELY
//    - Show: "✅ Correct!" or "❌ Incorrect"
//    - Show explanation from Claude
//    - Show leaderboard preview

// 2. Leaderboard: /components/DailyQuestionLeaderboard.tsx
//    - Rank | Username | Status (✅/❌) | Time
//    - Option distribution pie chart
//    - "You are #234 out of 1,234"

// 3. History Page: /pages/DailyQuestionHistory.tsx
//    - Show past 30 questions
//    - Show your attempt for each
//    - Show explanation
//    - Show success rate trend
```

**Implementation Steps:**

1. Create daily_questions & daily_submissions tables
2. Setup Claude API integration
3. Build POST submit endpoint with AI verification
4. Build leaderboard endpoint
5. Seed 10 sample questions
6. Create daily question widget
7. Create leaderboard component
8. Build history page
9. Test full flow

---

### FEATURE 1.6: Discussions (Q&A) (UNCHANGED)

See COMPLETE_IMPLEMENTATION_ROADMAP.md - no changes

---

### FEATURE 1.7: User Profiles & Stats (UPDATED)

**What:** User profile with reputation, stats, and verification badges

**New Additions:**
- Reputation score (based on hybrid rating system)
- Group creator verification status
- Accuracy rate

**Database Schema (UPDATED):**

```sql
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  
  -- Content stats
  content_count INT DEFAULT 0,
  content_upvotes INT DEFAULT 0,
  content_downvotes INT DEFAULT 0,
  
  -- Answer stats
  answer_count INT DEFAULT 0,
  answer_upvotes INT DEFAULT 0,
  answer_downvotes INT DEFAULT 0,
  
  -- Reputation (Hybrid)
  reputation_score INT DEFAULT 0,
  accuracy_rate DECIMAL(3,2) DEFAULT 0.0,
  
  -- Streaks
  daily_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  
  -- Group creation
  can_create_group BOOLEAN DEFAULT false,
  groups_created INT DEFAULT 0,
  
  -- Daily questions
  total_attempts INT DEFAULT 0,
  correct_attempts INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reputation calculation function
CREATE OR REPLACE FUNCTION calculate_reputation(user_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN (
    (SELECT COALESCE(SUM(net_rating), 0) FROM content WHERE creator_id = user_id)
    + (SELECT COALESCE(SUM(upvotes - downvotes), 0) FROM answers WHERE creator_id = user_id)
    - (SELECT COALESCE(COUNT(*) * 5, 0) FROM reports WHERE reported_id = user_id AND status = 'resolved')
  );
END;
$$ LANGUAGE plpgsql;
```

**Group Creator Verification (NEW):**

```sql
CREATE TABLE group_creator_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  
  -- Verification criteria
  account_age_days INT,
  upload_count INT,
  upvote_count INT,
  accuracy_rate DECIMAL(3,2),
  pending_reports INT,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  
  -- Criteria met
  meets_account_age BOOLEAN,
  meets_uploads BOOLEAN,
  meets_upvotes BOOLEAN,
  meets_accuracy BOOLEAN,
  no_pending_reports BOOLEAN,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification logic
CREATE OR REPLACE FUNCTION check_group_creator_eligibility(user_id UUID)
RETURNS TABLE(
  can_create BOOLEAN,
  reason VARCHAR,
  account_age INT,
  uploads INT,
  upvotes INT,
  accuracy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (account_age >= 7 AND uploads >= 5 AND upvotes >= 20 AND accuracy >= 0.75 AND pending_count = 0)::BOOLEAN,
    CASE 
      WHEN account_age < 7 THEN 'Account must be 7+ days old'
      WHEN uploads < 5 THEN 'Need 5+ uploads'
      WHEN upvotes < 20 THEN 'Need 20+ upvotes'
      WHEN accuracy < 0.75 THEN 'Need 75%+ accuracy'
      WHEN pending_count > 0 THEN 'Resolve pending reports first'
      ELSE 'Eligible to create groups'
    END::VARCHAR,
    account_age,
    uploads,
    upvotes,
    accuracy
  FROM (
    SELECT
      EXTRACT(DAY FROM NOW() - users.created_at)::INT as account_age,
      COALESCE((SELECT COUNT(*) FROM content WHERE creator_id = user_id), 0)::INT as uploads,
      COALESCE((SELECT SUM(total_upvotes) FROM content WHERE creator_id = user_id), 0)::INT as upvotes,
      COALESCE((SELECT SUM(correct_attempts)::DECIMAL / SUM(total_attempts) 
                FROM user_stats WHERE user_id = user_id), 0)::DECIMAL(3,2) as accuracy,
      COALESCE((SELECT COUNT(*) FROM reports 
                WHERE reported_id = user_id AND status = 'pending'), 0)::INT as pending_count
    FROM users
    WHERE id = user_id
  ) subquery;
END;
$$ LANGUAGE plpgsql;
```

**API Endpoints (UPDATED):**

```
GET /api/users/:username/profile
  Response: {
    id, username, avatar, bio,
    stats: {
      content_count, answer_count,
      reputation_score, accuracy_rate,
      daily_streak, longest_streak,
      can_create_group
    },
    recent_content: [...],
    badges: [...]
  }

GET /api/users/:username/group-creator-eligibility
  Response: {
    can_create: boolean,
    reason: string,
    account_age: days,
    uploads: count,
    upvotes: count,
    accuracy: percentage,
    meets_all_criteria: boolean
  }
```

**Frontend Implementation (UPDATED):**

```typescript
// 1. Profile Page: /pages/UserProfile.tsx
//    - Shows user info
//    - Shows reputation score (prominently)
//    - Shows accuracy rate
//    - Shows group creation eligibility
//    - Shows "Create Group" button (if eligible)
//    - If not eligible: Shows progress to eligibility

// 2. Profile Card: /components/ProfileCard.tsx
//    - Mini version
//    - Shows reputation badge
//    - Shows group creator badge (if eligible)
//    - Shows accuracy indicator

// 3. Eligibility Widget: /components/GroupCreatorEligibility.tsx
//    If not eligible:
//    ├── ✅ Account age: 3/7 days
//    ├── ✅ Uploads: 5/5
//    ├── ❌ Upvotes: 12/20 (8 more needed)
//    ├── ✅ Accuracy: 80%
//    └── "You'll be eligible in 4 days!"
```

**Implementation Steps:**

1. Create user_stats table with new fields
2. Create group_creator_verification table
3. Create reputation calculation function
4. Create eligibility check function
5. Build eligibility endpoint
6. Update profile page with new info
7. Create eligibility widget
8. Test verification logic

---

### FEATURE 1.8: Study Groups (Verified Creators Only) (NEW)

**What:** Users who meet criteria can create study groups

**Verification Requirements:**
- Account age: 7+ days
- Uploads: 5+ pieces
- Upvotes: 20+ total
- Accuracy: 75%+
- No pending reports

**Database Schema:**

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  owner_id UUID NOT NULL REFERENCES users(id),
  category_id INT REFERENCES categories(id),
  goal TEXT, -- "10 UPSC Prelims daily"
  member_limit INT DEFAULT 50,
  is_public BOOLEAN DEFAULT true,
  member_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  role VARCHAR(50) DEFAULT 'member'
);

CREATE TABLE group_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID UNIQUE NOT NULL REFERENCES groups(id),
  total_members INT DEFAULT 1,
  group_streak INT DEFAULT 0,
  total_discussions INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**

```
POST /api/groups/verify-eligibility
  Headers: Authorization: Bearer <token>
  Response: { can_create: boolean, reason: string, missing_criteria: [...] }

POST /api/groups
  Headers: Authorization: Bearer <token>
  Body: { name, description, goal, category_id }
  Validation: User must be eligible to create group
  Response: { success, group }

GET /api/groups/:id
  Response: Group details with members

POST /api/groups/:id/join
  Headers: Authorization: Bearer <token>
  Response: { success }

GET /api/groups/my-groups
  Headers: Authorization: Bearer <token>
  Response: All groups user is member of
```

**Frontend Implementation:**

```typescript
// 1. Create Group Modal: /components/CreateGroupModal.tsx
//    - Check eligibility first
//    - If not eligible: Show eligibility requirements
//    - If eligible: Show form to create group

// 2. Group View: /pages/GroupDetail.tsx
//    - Group info
//    - Members list
//    - Join button (if user not member)

// 3. Groups List: /pages/MyGroups.tsx
//    - Show all groups user is in
//    - Show "Create Group" button (if eligible)
```

**Implementation Steps:**

1. Create groups, group_members, group_stats tables
2. Build eligibility check endpoint
3. Build create group endpoint (with eligibility check)
4. Build join group endpoint
5. Create group creation modal
6. Create groups list page
7. Test eligibility logic

---

## PHASE 1 FINAL CHECKLIST

### Week 1:
- [ ] Auth system (signup/login)
- [ ] PostgreSQL setup
- [ ] Seed UPSC, JEE, Finance with 4 levels (150+ categories)
- [ ] Deploy basic auth

### Week 2:
- [ ] Content upload (YouTube validation + PDF)
- [ ] Category browser (4-level drill-down)
- [ ] Comments on content
- [ ] Hybrid rating system (upvotes/downvotes)

### Week 3:
- [ ] Daily questions system
- [ ] Claude API integration
- [ ] AI verification for MCQs
- [ ] Daily leaderboards
- [ ] User profiles with reputation

### Week 4:
- [ ] Group creation (with verification)
- [ ] UI polish
- [ ] Bug fixes
- [ ] Production deployment
- [ ] Seed 1000+ content pieces
- [ ] Beta test with 50 users

---

## PART 3: UPDATED PHASE 2 - ENGAGEMENT (Weeks 5-8)

### Features to Add:

1. **Daily Streaks** (if not fully implemented in Phase 1)
2. **Global Leaderboards** (by reputation, not just points)
3. **Badges** (achievable through various activities)
4. **Notifications** (in-app)
5. **Discussions** (Q&A if not done in Phase 1)

### Timeline:
- Week 5: Streaks + Leaderboards
- Week 6: Badges + Basic notifications
- Week 7: Discussions Q&A
- Week 8: Polish & user testing

---

## PART 4: UPDATED PHASE 3 - COMMUNITY (Weeks 9-12)

### Features to Add:

1. **Group Leaderboards** (within groups)
2. **Extended AI Verification** (for essays, discussions)
3. **Group Streaks** (collective group goal tracking)
4. **Email Notifications** (daily digest, weekly summary)
5. **Analytics Dashboard** (for users)

### Timeline:
- Week 9: Group leaderboards + extended AI
- Week 10: Group streaks + email
- Week 11: Analytics dashboard
- Week 12: Polish & scale testing

---

## PART 5: UPDATED DATABASE SCHEMA

Complete schema with all Phase 1 features:

```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio VARCHAR(500),
  avatar VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories (4-level hierarchy)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(500),
  parent_id INT REFERENCES categories(id),
  domain VARCHAR(50) NOT NULL,
  level INT,
  path VARCHAR(500),
  icon VARCHAR(50),
  order_position INT,
  is_leaf BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Stats
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  content_count INT DEFAULT 0,
  content_upvotes INT DEFAULT 0,
  content_downvotes INT DEFAULT 0,
  answer_count INT DEFAULT 0,
  answer_upvotes INT DEFAULT 0,
  answer_downvotes INT DEFAULT 0,
  reputation_score INT DEFAULT 0,
  accuracy_rate DECIMAL(3,2) DEFAULT 0.0,
  daily_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  can_create_group BOOLEAN DEFAULT false,
  groups_created INT DEFAULT 0,
  total_attempts INT DEFAULT 0,
  correct_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content (Videos & Notes)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000),
  type VARCHAR(50) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail VARCHAR(500),
  file_size INT,
  version INT DEFAULT 1,
  creator_id UUID NOT NULL REFERENCES users(id),
  category_id INT NOT NULL REFERENCES categories(id),
  avg_rating DECIMAL(3,2) DEFAULT 0.0,
  total_upvotes INT DEFAULT 0,
  total_downvotes INT DEFAULT 0,
  net_rating INT DEFAULT 0,
  accuracy_rate DECIMAL(3,2) DEFAULT 0.0,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  text VARCHAR(5000) NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ratings (for upvote/downvote)
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  rating VARCHAR(50), -- 'upvote' or 'downvote'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_id, user_id)
);

-- Daily Questions
CREATE TABLE daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_type VARCHAR(50),
  category_id INT REFERENCES categories(id),
  question_text VARCHAR(2000) NOT NULL,
  difficulty VARCHAR(50),
  option_a VARCHAR(500),
  option_b VARCHAR(500),
  option_c VARCHAR(500),
  option_d VARCHAR(500),
  correct_option VARCHAR(1),
  explanation VARCHAR(5000),
  source VARCHAR(255),
  publish_date DATE NOT NULL,
  deadline TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily Submissions
CREATE TABLE daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES daily_questions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  answer_text VARCHAR(2000) NOT NULL,
  is_correct BOOLEAN,
  ai_verified BOOLEAN DEFAULT true,
  ai_verdict VARCHAR(50),
  ai_confidence DECIMAL(3,2),
  verified_at TIMESTAMP,
  rank INT,
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Discussions
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id),
  category_id INT NOT NULL REFERENCES categories(id),
  views INT DEFAULT 0,
  solved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id),
  text VARCHAR(5000) NOT NULL,
  verified BOOLEAN DEFAULT false,
  llm_verdict VARCHAR(50),
  llm_note VARCHAR(1000),
  avg_rating DECIMAL(3,2) DEFAULT 0.0,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  owner_id UUID NOT NULL REFERENCES users(id),
  category_id INT REFERENCES categories(id),
  goal TEXT,
  member_limit INT DEFAULT 50,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group Members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  category VARCHAR(50),
  icon VARCHAR(50),
  rarity VARCHAR(50)
);

-- User Badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

---

## KEY CHANGES SUMMARY

### What Changed from Original:

1. ✅ **Categories: 3 → 4 levels** (match UPSC syllabus)
2. ✅ **Video Upload: File hosting → YouTube embedding** (cost-effective)
3. ✅ **Rating System: Upvotes only → Hybrid (up/down)** (balance)
4. ✅ **AI Verification: Phase 3 → Phase 1** (trust from day 1)
5. ✅ **Groups: Free creation → Verified creators only** (quality control)

### What DIDN'T Change:

- Tech stack (React, Node, TypeScript, PostgreSQL)
- Phase timeline (still 4 weeks for MVP)
- Core features (categories, content, daily Q, discussions)
- Architecture pattern

### What's New in Phase 1:

- AI verification for MCQs (immediate)
- Hybrid rating system
- Group creator verification
- Reputation scoring
- Enhanced category hierarchy

---

## NEXT STEPS

1. Review this updated roadmap
2. Start with Week 1 (Auth + Categories)
3. Follow week-by-week checklist
4. Deploy early and often
5. Gather user feedback
6. Iterate based on feedback

**You're ready to build. Start coding!** 🚀

