# Technical Specification: Online Language School Platform

**Version:** 1.4  
**Status:** Draft  
**Audience:** Development Team  
**Scale:** 5 Teachers · ~60 Students · Single-tenant SaaS  
**Currency:** EUR (single currency, fixed)

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-03 | Initial spec |
| 1.1 | 2026-04-03 | Resolved open questions; Manual Bank Payment; group class PayPal; EUR locked |
| 1.2 | 2026-04-03 | Cart feature — multi-item cart, single PayPal checkout, coupon at cart level |
| 1.3 | 2026-04-03 | Admin Refund page — Refund model, access revocation, partial refund |
| 1.4 | 2026-04-03 | Architecture updated to Server Actions; all frontend pages documented; recurring availability (weekly pattern, 2-week window) moved to Phase 1 |

---

## 1. System Overview

A mobile-first online classroom platform for a specific language school. Students can browse and purchase video courses, book 1-on-1 private lessons, and enroll in group classes. Teachers manage availability and track earnings. Admins have full oversight over scheduling, finances, and user management.

### 1.1 Core Capabilities

| Capability | Description |
|---|---|
| Authentication & Authorization | Role-based access (Student / Teacher / Admin) |
| Private Lessons | Book, cancel, track 1-on-1 sessions with packages |
| Group Classes | Sign up for cohort-based scheduled courses |
| Video Courses | Purchase, stream recorded content |
| Shopping Cart | Add multiple items, apply coupon, pay once via PayPal |
| Payments | PayPal Orders API v2 + Admin manual bank transfer recording |
| Refunds | Admin records refunds and revokes access for any item type |
| Scheduling | Weekly recurring availability + conflict prevention |
| Notifications | Email confirmations, reminders, cancellations, refund confirmations |
| Finance | Per-teacher earnings, school revenue dashboard |

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 19+ (App Router) | SSR/RSC for SEO and performance |
| Styling | Tailwind CSS | Rapid mobile-first UI |
| Database | PostgreSQL (Neon / Supabase) | Relational integrity for scheduling/finance |
| ORM | Prisma | Type-safe DB access, migration tooling |
| Auth | NextAuth.js v5 | Session management, JWT |
| Server Actions | Next.js built-in | All mutations — no separate REST API needed |
| Payments | PayPal REST API (Orders API v2) | School's chosen online processor |
| Video Hosting | Vimeo Pro/Business | Reliable embedded streaming |
| Deployment | Vercel | Zero-config Next.js deployment |
| Email | Resend / SendGrid | Transactional email |
| Timezone | `date-fns-tz` / `Intl` API | Server-side tz normalisation |

---

## 3. Architecture

### 3.1 High-Level Architecture

```
Browser (Next.js App Router)
        │
        ├── Public pages      (Home, Course catalogue, Auth)
        └── Protected App     (Role-based dashboards)
                │
        Server Components     (data fetching — reads)
        Server Actions        (mutations — writes)
                │
         ┌──────┴────────────┐
         │                   │
      Prisma ORM         External APIs
         │               (PayPal, Vimeo, Email)
         │
    PostgreSQL (Neon/Supabase)

  API Routes (only 2 — require an HTTP URL):
    /api/auth/[...nextauth]   ← NextAuth
    /api/cart/capture         ← PayPal JS SDK callback
```

### 3.2 Server Actions vs API Routes

| Concern | Approach | Reason |
|---|---|---|
| All mutations (book, cancel, refund, cart, …) | **Server Actions** | Called directly from components; no fetch/URL needed |
| NextAuth | API Route `/api/auth/[...nextauth]` | Required by NextAuth library |
| PayPal capture | API Route `/api/cart/capture` | PayPal JS SDK requires a publicly addressable URL |

### 3.3 Rendering Strategy

| Page Type | Strategy |
|---|---|
| Home / Marketing | SSG |
| Course Catalogue (public) | ISR (1 min TTL) |
| Dashboard / App pages | Server Components + Server Actions |
| Cart & Checkout | Client Component (dynamic totals, PayPal SDK) |
| Course Player | Client Component (video state) |

### 3.4 Complete Folder Structure

```
src/
  app/
    ├── (public)/
    │     ├── page.tsx                        # Home / marketing page
    │     ├── courses/
    │     │     ├── page.tsx                  # Public course catalogue
    │     │     └── [courseId]/
    │     │           └── page.tsx            # Public course detail + preview player
    │     ├── login/
    │     │     └── page.tsx                  # Login form
    │     └── register/
    │           └── page.tsx                  # Register form
    │
    ├── (protected)/
    │     ├── student/
    │     │     ├── dashboard/
    │     │     │     └── page.tsx            # Student overview
    │     │     ├── private-lessons/
    │     │     │     ├── page.tsx            # Active packages + upcoming lessons
    │     │     │     ├── book/
    │     │     │     │     └── page.tsx      # Pick teacher → pick slot → confirm
    │     │     │     └── history/
    │     │     │           └── page.tsx      # Past lessons list
    │     │     ├── group-lessons/
    │     │     │     ├── page.tsx            # Upcoming group courses + enroll CTA
    │     │     │     └── [courseId]/
    │     │     │           └── page.tsx      # Group course detail
    │     │     ├── video-courses/
    │     │     │     ├── page.tsx            # My courses + available courses
    │     │     │     └── [courseId]/
    │     │     │           └── page.tsx      # Course player (modules + lessons)
    │     │     ├── cart/
    │     │     │     └── page.tsx            # Cart review + coupon + PayPal checkout
    │     │     └── profile/
    │     │           └── page.tsx            # Avatar upload, change password
    │     │
    │     ├── teacher/
    │     │     ├── dashboard/
    │     │     │     └── page.tsx            # Overview: students, lessons, earnings
    │     │     ├── private-lessons/
    │     │     │     ├── page.tsx            # Student list + scheduled lessons
    │     │     │     ├── availability/
    │     │     │     │     └── page.tsx      # Weekly recurring slots + manual slots
    │     │     │     └── schedule/
    │     │     │           └── page.tsx      # Schedule a lesson for a student
    │     │     └── group-lessons/
    │     │           ├── page.tsx            # Upcoming group lessons list
    │     │           └── [lessonId]/
    │     │                 └── page.tsx      # Mark held + record attendance
    │     │
    │     └── admin/
    │           ├── dashboard/
    │           │     └── page.tsx            # Admin overview
    │           ├── private-lessons/
    │           │     ├── page.tsx            # All teachers + their lessons
    │           │     ├── reassign/
    │           │     │     └── page.tsx      # Reassign student to different teacher
    │           │     └── schedule/
    │           │           └── page.tsx      # Schedule lesson for any teacher+student
    │           ├── group-lessons/
    │           │     ├── page.tsx            # All group courses overview
    │           │     ├── new/
    │           │     │     └── page.tsx      # Create group course
    │           │     └── [courseId]/
    │           │           └── page.tsx      # Edit course, assign teacher+students
    │           ├── video-courses/
    │           │     ├── page.tsx            # All video courses + sales stats
    │           │     ├── new/
    │           │     │     └── page.tsx      # Create video course
    │           │     └── [courseId]/
    │           │           └── page.tsx      # Edit course, modules, lessons, pricing
    │           ├── users/
    │           │     ├── page.tsx            # User list (role, status filters)
    │           │     └── [userId]/
    │           │           └── page.tsx      # Edit user role/status
    │           ├── finance/
    │           │     ├── page.tsx            # Monthly totals + per-teacher breakdown
    │           │     ├── pricing/
    │           │     │     └── page.tsx      # Set teacher pricing
    │           │     └── manual-payments/
    │           │           ├── page.tsx      # Manual payment records list
    │           │           └── new/
    │           │                 └── page.tsx # Record new bank payment
    │           └── refunds/
    │                 ├── page.tsx            # Refund records list
    │                 └── new/
    │                       └── page.tsx      # Issue a refund (3-step form)
    │
    └── api/
          ├── auth/[...nextauth]/
          │     └── route.ts                  # NextAuth handler (must be API route)
          └── cart/capture/
                └── route.ts                  # PayPal capture callback (must be API route)

  actions/                                    # All Server Actions (mutations)
    ├── auth.ts                               # login, register, logout
    ├── availability.ts                       # addSlot, removeSlot, saveRecurringPattern, generateSlots
    ├── cart.ts                               # addItem, removeItem, clearCart, applyCoupon, checkout
    ├── lessons.ts                            # bookLesson, cancelLesson, completeLesson
    ├── groupLessons.ts                       # markHeld, recordAttendance
    ├── refunds.ts                            # issueRefund
    ├── manualPayment.ts                      # recordPayment
    ├── finance.ts                            # getSummary, getTeacherEarnings
    └── admin/
          ├── users.ts                        # changeRole, changeStatus
          ├── courses.ts                      # createCourse, updateCourse, publishCourse
          └── groupCourses.ts                 # createGroupCourse, assignTeacher, assignStudents

  components/
    ├── ui/                                   # Shared: Button, Input, Modal, Badge, Table
    ├── cart/                                 # CartDrawer, CartItem, OrderSummary, CouponInput
    ├── scheduling/                           # WeeklyPatternEditor, SlotPicker, LessonCalendar
    ├── lessons/                              # LessonCard, PackageStatus, AttendanceForm
    ├── courses/                              # CourseCard, ModuleList, VideoPlayer
    └── layouts/                             # StudentLayout, TeacherLayout, AdminLayout

  lib/
    ├── prisma.ts                             # Prisma client singleton
    ├── paypal.ts                             # PayPal SDK wrapper
    ├── auth.ts                               # NextAuth config
    ├── email.ts                              # Email templates + sender
    ├── scheduling.ts                         # Conflict check, slot generation logic
    └── cart.ts                               # Total calculation, coupon application

  middleware.ts                               # Auth guard + role-based redirect
```

---

## 4. Data Model

### 4.1 Entity Relationship Overview

```
User (1) ──── Cart (1)
Cart (1) ──< CartItem (many)
User (1) ──< RecurringSlot (many)             weekly pattern per teacher
RecurringSlot → generates → TeacherAvailability (concrete slots, up to 2 weeks ahead)

Transaction (1) ──< LessonPackage
Transaction (1) ──< GroupEnrollment
Transaction (1) ──< CourseEnrollment
ManualPayment ──< LessonPackage / GroupEnrollment / CourseEnrollment
Refund ──> LessonPackage | GroupEnrollment | CourseEnrollment
```

### 4.2 Database Schema (Prisma SDL)

```prisma
// ─── USERS ───────────────────────────────────────────────
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  role          Role          @default(STUDENT)
  status        UserStatus    @default(ACTIVE)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  studentsPackages       LessonPackage[]       @relation("PackageStudent")
  lessonsAsStudent       PrivateLesson[]       @relation("LessonStudent")
  lessonsAsTeacher       PrivateLesson[]       @relation("LessonTeacher")
  availability           TeacherAvailability[]
  recurringSlots         RecurringSlot[]
  teacherPricing         TeacherPricing[]
  groupEnrollments       GroupEnrollment[]
  teacherGroupLessons    GroupLesson[]
  courseEnrollments      CourseEnrollment[]
  transactions           Transaction[]
  cart                   Cart?
  manualPaymentsRecorded ManualPayment[]       @relation("RecordedBy")
  manualPaymentsReceived ManualPayment[]       @relation("PaidBy")
  refundsIssued          Refund[]              @relation("RefundIssuedBy")
  refundsReceived        Refund[]              @relation("RefundReceivedBy")
}

enum Role       { STUDENT TEACHER ADMIN }
enum UserStatus { ACTIVE IDLE INACTIVE }

// ─── RECURRING AVAILABILITY ───────────────────────────────
// Teacher defines a weekly pattern (e.g. Monday 10:00, Wednesday 14:00).
// System generates concrete TeacherAvailability rows up to 14 days ahead.
model RecurringSlot {
  id        String   @id @default(cuid())
  teacherId String
  teacher   User     @relation(fields: [teacherId], references: [id])
  dayOfWeek Int      // 0 = Sunday … 6 = Saturday
  startHour Int      // 0–23 (UTC)
  startMin  Int      // 0 or 30
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([teacherId, dayOfWeek, startHour, startMin])
}

// ─── CONCRETE AVAILABILITY SLOTS ─────────────────────────
model TeacherAvailability {
  id               String    @id @default(cuid())
  teacherId        String
  teacher          User      @relation(fields: [teacherId], references: [id])
  startTime        DateTime  // UTC
  endTime          DateTime  // UTC (startTime + 50 min)
  isBooked         Boolean   @default(false)
  recurringSlotId  String?   // set if generated from a RecurringSlot
  createdAt        DateTime  @default(now())

  lesson           PrivateLesson?
}

// ─── PRIVATE LESSONS ─────────────────────────────────────
model LessonPackage {
  id               String              @id @default(cuid())
  studentId        String
  student          User                @relation("PackageStudent", fields: [studentId], references: [id])
  teacherId        String
  packageType      PackageType
  totalLessons     Int
  remainingLessons Int
  status           LessonPackageStatus @default(ACTIVE)
  activatedAt      DateTime            @default(now())
  expiresAt        DateTime
  transactionId    String?
  transaction      Transaction?        @relation(fields: [transactionId], references: [id])
  manualPaymentId  String?
  manualPayment    ManualPayment?      @relation(fields: [manualPaymentId], references: [id])
  createdAt        DateTime            @default(now())

  lessons          PrivateLesson[]
  refund           Refund?
}

enum LessonPackageStatus { ACTIVE EXPIRED REFUNDED }
enum PackageType         { SINGLE STARTER STANDARD PREMIUM }

model PrivateLesson {
  id                 String              @id @default(cuid())
  studentId          String
  student            User                @relation("LessonStudent", fields: [studentId], references: [id])
  teacherId          String
  teacher            User                @relation("LessonTeacher", fields: [teacherId], references: [id])
  packageId          String?
  package            LessonPackage?      @relation(fields: [packageId], references: [id])
  availabilityId     String              @unique
  availability       TeacherAvailability @relation(fields: [availabilityId], references: [id])
  scheduledAt        DateTime            // UTC
  status             LessonStatus        @default(SCHEDULED)
  completedByStudent Boolean             @default(false)
  completedByTeacher Boolean             @default(false)
  cancelledAt        DateTime?
  cancelReason       String?
  notes              String?
  createdAt          DateTime            @default(now())
}

enum LessonStatus { SCHEDULED COMPLETED CANCELLED CANCELLED_LATE }

// ─── TEACHER PRICING ─────────────────────────────────────
model TeacherPricing {
  id              String      @id @default(cuid())
  teacherId       String
  teacher         User        @relation(fields: [teacherId], references: [id])
  packageType     PackageType
  priceForSchool  Decimal     @db.Decimal(10,2)
  priceForTeacher Decimal     @db.Decimal(10,2)
  updatedAt       DateTime    @updatedAt

  @@unique([teacherId, packageType])
}

// ─── GROUP COURSES ────────────────────────────────────────
model GroupCourse {
  id          String            @id @default(cuid())
  title       String
  description String?
  teacherId   String
  minStudents Int
  maxStudents Int
  price       Decimal           @db.Decimal(10,2)
  status      GroupCourseStatus @default(UPCOMING)
  createdAt   DateTime          @default(now())

  lessons     GroupLesson[]
  enrollments GroupEnrollment[]
}

enum GroupCourseStatus { UPCOMING ACTIVE COMPLETED CANCELLED }

model GroupLesson {
  id              String      @id @default(cuid())
  courseId        String
  course          GroupCourse @relation(fields: [courseId], references: [id])
  teacherId       String
  teacher         User        @relation(fields: [teacherId], references: [id])
  scheduledAt     DateTime
  durationMin     Int         @default(50)
  isHeld          Boolean     @default(false)
  notes           String?
  presentStudents String[]
  createdAt       DateTime    @default(now())
}

model GroupEnrollment {
  id              String           @id @default(cuid())
  studentId       String
  student         User             @relation(fields: [studentId], references: [id])
  courseId        String
  course          GroupCourse      @relation(fields: [courseId], references: [id])
  status          EnrollmentStatus @default(ACTIVE)
  transactionId   String?
  transaction     Transaction?     @relation(fields: [transactionId], references: [id])
  manualPaymentId String?
  manualPayment   ManualPayment?   @relation(fields: [manualPaymentId], references: [id])
  enrolledAt      DateTime         @default(now())

  refund          Refund?

  @@unique([studentId, courseId])
}

// ─── VIDEO COURSES ────────────────────────────────────────
model VideoCourse {
  id            String            @id @default(cuid())
  title         String
  description   String?
  coverImageUrl String?
  price         Decimal           @db.Decimal(10,2)
  isPublished   Boolean           @default(false)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  modules     CourseModule[]
  enrollments CourseEnrollment[]
}

model CourseModule {
  id       String        @id @default(cuid())
  courseId String
  course   VideoCourse   @relation(fields: [courseId], references: [id])
  title    String
  order    Int
  lessons  VideoLesson[]
}

model VideoLesson {
  id          String       @id @default(cuid())
  moduleId    String
  module      CourseModule @relation(fields: [moduleId], references: [id])
  title       String
  vimeoId     String
  order       Int
  isPreview   Boolean      @default(false)
  durationSec Int?
}

model CourseEnrollment {
  id              String           @id @default(cuid())
  studentId       String
  student         User             @relation(fields: [studentId], references: [id])
  courseId        String
  course          VideoCourse      @relation(fields: [courseId], references: [id])
  status          EnrollmentStatus @default(ACTIVE)
  transactionId   String?
  transaction     Transaction?     @relation(fields: [transactionId], references: [id])
  manualPaymentId String?
  manualPayment   ManualPayment?   @relation(fields: [manualPaymentId], references: [id])
  enrolledAt      DateTime         @default(now())

  refund          Refund?

  @@unique([studentId, courseId])
}

enum EnrollmentStatus { ACTIVE REFUNDED }

// ─── CART ─────────────────────────────────────────────────
model Cart {
  id         String     @id @default(cuid())
  userId     String     @unique
  user       User       @relation(fields: [userId], references: [id])
  couponCode String?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  items      CartItem[]
}

model CartItem {
  id            String       @id @default(cuid())
  cartId        String
  cart          Cart         @relation(fields: [cartId], references: [id], onDelete: Cascade)
  itemType      CartItemType
  teacherId     String?
  packageType   PackageType?
  courseId      String?
  priceSnapshot Decimal      @db.Decimal(10,2)
  createdAt     DateTime     @default(now())
}

enum CartItemType { LESSON_PACKAGE GROUP_COURSE VIDEO_COURSE }

// ─── TRANSACTIONS ─────────────────────────────────────────
model Transaction {
  id             String            @id @default(cuid())
  userId         String
  user           User              @relation(fields: [userId], references: [id])
  paypalOrderId  String?           @unique
  grossAmount    Decimal           @db.Decimal(10,2)
  discountAmount Decimal           @db.Decimal(10,2) @default(0)
  netAmount      Decimal           @db.Decimal(10,2)
  couponCode     String?
  status         TransactionStatus @default(PENDING)
  createdAt      DateTime          @default(now())
  completedAt    DateTime?

  packages          LessonPackage[]
  groupEnrollments  GroupEnrollment[]
  courseEnrollments CourseEnrollment[]
  refunds           Refund[]
}

enum TransactionStatus { PENDING COMPLETED FAILED REFUNDED PARTIAL_REFUND }

// ─── MANUAL BANK PAYMENTS ────────────────────────────────
model ManualPayment {
  id            String          @id @default(cuid())
  recordedById  String
  recordedBy    User            @relation("RecordedBy", fields: [recordedById], references: [id])
  studentId     String
  student       User            @relation("PaidBy", fields: [studentId], references: [id])
  amount        Decimal         @db.Decimal(10,2)
  referenceNote String?
  paidAt        DateTime
  createdAt     DateTime        @default(now())

  packages          LessonPackage[]
  groupEnrollments  GroupEnrollment[]
  courseEnrollments CourseEnrollment[]
  refunds           Refund[]
}

// ─── REFUNDS ──────────────────────────────────────────────
model Refund {
  id              String          @id @default(cuid())
  issuedById      String
  issuedBy        User            @relation("RefundIssuedBy", fields: [issuedById], references: [id])
  studentId       String
  student         User            @relation("RefundReceivedBy", fields: [studentId], references: [id])
  refundType      RefundType
  refundMethod    RefundMethod
  refundAmount    Decimal         @db.Decimal(10,2)
  reason          String?
  transactionId   String?
  transaction     Transaction?    @relation(fields: [transactionId], references: [id])
  manualPaymentId String?
  manualPayment   ManualPayment?  @relation(fields: [manualPaymentId], references: [id])
  lessonPackageId    String?           @unique
  lessonPackage      LessonPackage?    @relation(fields: [lessonPackageId], references: [id])
  groupEnrollmentId  String?           @unique
  groupEnrollment    GroupEnrollment?  @relation(fields: [groupEnrollmentId], references: [id])
  courseEnrollmentId String?           @unique
  courseEnrollment   CourseEnrollment? @relation(fields: [courseEnrollmentId], references: [id])
  createdAt       DateTime        @default(now())
}

enum RefundType   { LESSON_PACKAGE GROUP_COURSE VIDEO_COURSE }
enum RefundMethod { PAYPAL BANK_TRANSFER OTHER }

// ─── COUPONS ──────────────────────────────────────────────
model Coupon {
  id             String         @id @default(cuid())
  code           String         @unique
  discountType   DiscountType
  discountValue  Decimal        @db.Decimal(10,2)
  applicableTo   CouponTarget[]
  validFrom      DateTime
  validUntil     DateTime
  maxUses        Int?
  usedCount      Int            @default(0)
  maxUsesPerUser Int?
  isActive       Boolean        @default(true)
  createdAt      DateTime       @default(now())
}

enum DiscountType { PERCENTAGE FIXED }
enum CouponTarget { LESSON_PACKAGE SINGLE_LESSON VIDEO_COURSE GROUP_CLASS }
```

---

## 5. Server Actions & API Routes

### 5.1 API Routes (HTTP endpoints — only 2)

| Route | Reason |
|---|---|
| `GET/POST /api/auth/[...nextauth]` | Required by NextAuth library |
| `POST /api/cart/capture` | PayPal JS SDK requires a publicly addressable URL |

### 5.2 Server Actions

All mutations are Server Actions in `actions/`. Called directly from components — no `fetch`, no URL.

#### `actions/auth.ts`
| Action | Description |
|---|---|
| `register(data)` | Create user (role = STUDENT by default) |
| `login(credentials)` | Authenticate, return session |
| `logout()` | Invalidate session |

#### `actions/availability.ts`
| Action | Description |
|---|---|
| `saveRecurringPattern(slots)` | Save teacher's weekly pattern; generate concrete slots for next 14 days |
| `generateSlotsForTeacher(teacherId)` | Expand recurring pattern → TeacherAvailability rows up to 2 weeks ahead (called on page load if window is stale) |
| `addManualSlot(data)` | Add a single one-off slot |
| `removeSlot(id)` | Delete an unbooked slot |

#### `actions/lessons.ts`
| Action | Description |
|---|---|
| `bookLesson(packageId, availabilityId)` | Book slot with row-level lock |
| `cancelLesson(lessonId, reason?)` | Cancel with 12h policy check |
| `completeLesson(lessonId, role)` | Mark completed (student or teacher) |
| `scheduleForStudent(teacherId, studentId, availabilityId)` | Admin / teacher schedules on behalf |

#### `actions/cart.ts`
| Action | Description |
|---|---|
| `addItem(itemType, payload)` | Add item; duplicate / already-owned check |
| `removeItem(cartItemId)` | Remove one item |
| `clearCart()` | Empty cart |
| `applyCoupon(code)` | Validate + store coupon on cart |
| `removeCoupon()` | Clear coupon from cart |
| `checkoutCart()` | Validate items + prices + coupon → create PayPal order → return `paypalOrderId` |

#### `actions/groupLessons.ts`
| Action | Description |
|---|---|
| `markLessonHeld(lessonId, notes, presentStudents)` | Mark group lesson as held + record attendance |

#### `actions/refunds.ts`
| Action | Description |
|---|---|
| `issueRefund(data)` | Revoke access + cancel lessons + create Refund record + email student |

#### `actions/manualPayment.ts`
| Action | Description |
|---|---|
| `recordPayment(data)` | Record bank payment + activate all items + email student |

#### `actions/finance.ts`
| Action | Description |
|---|---|
| `getMonthlySummary(month)` | Total revenue breakdown by type |
| `getTeacherEarnings(teacherId, month)` | Per-teacher school revenue vs. teacher pay |

#### `actions/admin/users.ts`
| Action | Description |
|---|---|
| `changeRole(userId, role)` | Change user role |
| `changeStatus(userId, status)` | Set ACTIVE / IDLE / INACTIVE |

#### `actions/admin/courses.ts`
| Action | Description |
|---|---|
| `createVideoCourse(data)` | Create course with cover image |
| `updateVideoCourse(id, data)` | Edit title, description, price |
| `publishCourse(id)` | Toggle isPublished |
| `addModule(courseId, data)` | Add module |
| `addLesson(moduleId, data)` | Add lesson (vimeoId, isPreview) |

#### `actions/admin/groupCourses.ts`
| Action | Description |
|---|---|
| `createGroupCourse(data)` | Create group course |
| `updateGroupCourse(id, data)` | Edit details, min/max students, price |
| `assignTeacher(courseId, teacherId)` | Assign teacher |
| `assignStudent(courseId, studentId)` | Enroll student |
| `scheduleGroupLesson(courseId, scheduledAt)` | Add a group lesson date |

---

## 6. Business Logic

### 6.1 Recurring Availability (Weekly Pattern, 2-Week Window)

```
saveRecurringPattern(slots: { dayOfWeek, startHour, startMin }[])
  1. Replace teacher's RecurringSlot rows (upsert by unique key)
  2. Call generateSlotsForTeacher(teacherId)

generateSlotsForTeacher(teacherId)
  1. Load all active RecurringSlots for teacher
  2. Compute window: today (UTC) → today + 14 days
  3. For each RecurringSlot × each date in window matching dayOfWeek:
       a. Compute slotStart = date + startHour:startMin (UTC)
       b. Skip if slotStart is in the past
       c. Skip if TeacherAvailability already exists for this
          (teacherId + startTime) to avoid duplicates
       d. Create TeacherAvailability { startTime, endTime = startTime + 50min,
                                        recurringSlotId }
  4. Return count of newly created slots
```

**Rules:**
- Slots are generated **up to 14 days** from today — never further.
- Generation is **idempotent**: re-running never creates duplicates (unique check on teacherId + startTime).
- `generateSlotsForTeacher` is called:
  - After saving a recurring pattern
  - When the teacher opens their availability page (fills any gap since last generation)
- If a teacher **deactivates** a RecurringSlot (`isActive = false`), future unbooked slots generated from it are deleted; already-booked slots are untouched.
- Teachers can still add **one-off manual slots** in addition to the recurring pattern.
- Admin can see all slots for all teachers.

### 6.2 Cart Checkout

```
checkoutCart() — Server Action
  1. Load cart + items
  2. Validate each item (exists, purchasable, not already owned)
  3. Stale price check: priceSnapshot ≠ current price → error { stalePrices }
  4. Re-validate coupon
  5. Compute grossAmount, discountAmount, netAmount
  6. Create PENDING Transaction in DB
  7. Create PayPal order via PayPal REST API for netAmount EUR
  8. Return { paypalOrderId, totals }

POST /api/cart/capture — API Route (PayPal callback)
  1. Idempotency: paypalOrderId @unique guard
  2. Call PayPal capture API → verify COMPLETED
  3. BEGIN DB TRANSACTION
  4. Activate each CartItem
  5. Mark Transaction COMPLETED; increment coupon.usedCount
  6. Clear cart
  7. COMMIT
  8. Send order-confirmation email
```

### 6.3 Scheduling & Conflict Prevention

```
bookLesson(packageId, availabilityId)
  1. Verify package ACTIVE, not expired, remainingLessons > 0
  2. BEGIN TRANSACTION
     a. SELECT FOR UPDATE on TeacherAvailability
     b. If isBooked → 409 Conflict
     c. Create PrivateLesson; set isBooked = true; decrement remainingLessons
  3. COMMIT
  4. Send booking confirmation emails
```

### 6.4 Cancellation Policy

```
cancelLesson(lessonId, reason?)
  STUDENT:
    diff < 12h → CANCELLED_LATE (no refund; teacher can revert)
    else       → CANCELLED; restore remainingLessons + 1; restore slot

  TEACHER / ADMIN:
    → CANCELLED; restore remainingLessons; restore slot

  Store cancelledAt; send cancellation email
```

### 6.5 Package Validity

| PackageType | Lessons | Validity |
|---|---|---|
| SINGLE | 1 | Immediate booking at purchase |
| STARTER | 4 | 30 days |
| STANDARD | 8 | 60 days |
| PREMIUM | 12 | 90 days |

Booking blocked if `status = REFUNDED` or `expiresAt < now()`.

### 6.6 Refund Logic

```
issueRefund(data)
  1. Verify item exists, belongs to student, not already REFUNDED
  2. BEGIN TRANSACTION
  3. LESSON_PACKAGE:
       - Set status = REFUNDED
       - Cancel all SCHEDULED lessons → CANCELLED; restore slots
       - Update Transaction → REFUNDED or PARTIAL_REFUND
  4. GROUP_COURSE:
       - Set GroupEnrollment.status = REFUNDED
       - Update Transaction → REFUNDED or PARTIAL_REFUND
  5. VIDEO_COURSE:
       - Set CourseEnrollment.status = REFUNDED (access revoked)
       - Update Transaction → REFUNDED or PARTIAL_REFUND
  6. Create Refund record (immutable)
  7. COMMIT
  8. Send refund-confirmation email to student
```

### 6.7 Coupon Application

- Validated server-side at apply-time and re-validated at checkout.
- Applied per eligible CartItem based on `applicableTo`.
- `PERCENTAGE` → `priceSnapshot × (value / 100)` per applicable item.
- `FIXED` → `min(value, priceSnapshot)` per applicable item.
- `usedCount` incremented only after successful PayPal capture.

### 6.8 Teacher Salary Calculation

```
teacher_pay    = SUM(priceForTeacher) WHERE status = COMPLETED, month = X
school_revenue = SUM(priceForSchool)  WHERE status = COMPLETED, month = X
                 − teacher_pay
```

Cancelled (including refund-cancelled) lessons excluded from both totals.

---

## 7. Page-by-Page Description

### 7.1 Public Pages

| Page | Description |
|---|---|
| `/` | School home: description, features, CTA to login/register |
| `/courses` | Public catalogue of published video courses (cover, title, price, preview badge) |
| `/courses/[courseId]` | Course detail: module list, preview lessons playable, locked lessons shown, price + "Add to Cart" CTA (redirects to login if unauthenticated) |
| `/login` | Email + password form |
| `/register` | Name + email + password form; role defaults to STUDENT |

### 7.2 Student Pages

| Page | Description |
|---|---|
| `/student/dashboard` | Welcome card, quick stats (active packages, upcoming lessons, enrolled courses) |
| `/student/private-lessons` | Active package cards (remaining lessons, expiry, teacher); upcoming scheduled lessons list |
| `/student/private-lessons/book` | Step 1: pick teacher → Step 2: pick available slot on calendar → Step 3: confirm (uses package or prompts to add package to cart) |
| `/student/private-lessons/history` | Past lessons (date, teacher, status) |
| `/student/group-lessons` | Upcoming group courses (title, date, seats left, price); "Add to Cart" per course |
| `/student/group-lessons/[courseId]` | Course detail: lessons schedule, teacher, enrolled students count, CTA |
| `/student/video-courses` | Two sections: "My Courses" (purchased, open player) + "Available Courses" (browse, add to cart) |
| `/student/video-courses/[courseId]` | Course player: module + lesson list (locked/unlocked), Vimeo embed for accessible lessons |
| `/student/cart` | Cart items, remove button, coupon input, order summary (subtotal / discount / total), "Pay with PayPal" |
| `/student/profile` | Upload avatar, change password |

### 7.3 Teacher Pages

| Page | Description |
|---|---|
| `/teacher/dashboard` | Stats card: active students, lessons held this month, lessons scheduled, monthly earnings |
| `/teacher/private-lessons` | Active students list (package type, remaining lessons, expiry); scheduled upcoming lessons |
| `/teacher/private-lessons/availability` | Weekly pattern editor (grid: day × time) + list of generated concrete slots (next 14 days); manual slot add/remove |
| `/teacher/private-lessons/schedule` | Pick student (from active students) → pick available slot → confirm booking |
| `/teacher/group-lessons` | List of assigned group courses + upcoming lesson dates |
| `/teacher/group-lessons/[lessonId]` | Mark lesson as held; attendance checkboxes per enrolled student; notes field |

### 7.4 Admin Pages

| Page | Description |
|---|---|
| `/admin/dashboard` | Platform-wide stats: total students, teachers, lessons this month, revenue this month |
| `/admin/private-lessons` | All teachers + their students and lesson status; drill down per teacher |
| `/admin/private-lessons/reassign` | Select student + target teacher → reassign (moves active package) |
| `/admin/private-lessons/schedule` | Pick teacher + student + slot → schedule lesson |
| `/admin/group-lessons` | All group courses overview (status, enrolled count, held/remaining lessons) |
| `/admin/group-lessons/new` | Create group course: title, description, teacher, min/max students, price |
| `/admin/group-lessons/[courseId]` | Edit course, assign/remove students, view lesson schedule |
| `/admin/video-courses` | All courses (published/draft), sales count, total + monthly revenue per course |
| `/admin/video-courses/new` | Create course: title, description, cover image, price |
| `/admin/video-courses/[courseId]` | Edit course; manage modules + lessons (add Vimeo ID, toggle isPreview); publish/unpublish; adjust price |
| `/admin/users` | User list with role + status filters; inline role/status change |
| `/admin/users/[userId]` | User detail: change role, change status, view their packages and enrollments |
| `/admin/finance` | Monthly totals (private, group, video); per-teacher breakdown (school revenue vs. teacher pay) |
| `/admin/finance/pricing` | Set priceForSchool + priceForTeacher per teacher per package type |
| `/admin/finance/manual-payments` | List of all manual bank payment records |
| `/admin/finance/manual-payments/new` | Record bank payment + activate item(s) for a student |
| `/admin/refunds` | All refund records (filterable by type, student, date); issue refund button |
| `/admin/refunds/new` | 3-step refund form: find item → enter amount + method + reason → confirm with access-change warning |

---

## 8. Authentication & Authorization

### 8.1 NextAuth Configuration

- Provider: **Credentials** (email + bcrypt, cost 12)
- Session: **JWT**, TTL 24h
- JWT: `{ id, email, role, status }`

### 8.2 Role Guards (`middleware.ts`)

```ts
const ROLE_PREFIXES = { STUDENT: '/student', TEACHER: '/teacher', ADMIN: '/admin' };
// On login → redirect to /{role}/dashboard
// Path prefix mismatch → 403
// INACTIVE status → force logout
```

### 8.3 Server Action Protection

Every Server Action calls `getServerSession()` at the top:
- No session → throw 401
- Wrong role → throw 403
- INACTIVE → throw 403

---

## 9. Payments

### 9.1 Cart-Based PayPal Flow

```
Student adds items to cart → /student/cart
  → "Pay with PayPal"
  → checkoutCart() Server Action
      → validate items + coupon
      → create PayPal order (netAmount EUR)
      → return paypalOrderId
  → PayPal JS SDK renders approval UI
  → POST /api/cart/capture (API Route)
      → capture PayPal order
      → activate all items
      → clear cart
      → send order-confirmation email
  → Redirect to /student/dashboard
```

### 9.2 Idempotency

- `paypalOrderId @unique` on Transaction.
- Duplicate capture → 409 with existing data.
- Group course max students re-checked inside DB transaction at capture.

### 9.3 Manual Bank Payment

- Admin records what was received + activates items in one Server Action.
- Multi-item supported; mirrors cart.
- Immutable audit record.

### 9.4 Refunds

- Money returned **externally** (PayPal dashboard or bank transfer).
- Platform records refund, revokes access, cancels affected lessons.
- `refundAmount` is what admin enters (may differ from original price).
- Transaction updated to `REFUNDED` or `PARTIAL_REFUND`.

---

## 10. Email Notifications

| Trigger | Recipients | Template |
|---|---|---|
| Cart checkout completed | Student | order-confirmation |
| Lesson booked | Student + Teacher | booking-confirmation |
| Lesson cancelled (on-time) | Both | cancellation-confirmed |
| Lesson cancelled (late) | Both | late-cancellation-notice |
| Lesson cancelled by teacher/admin | Student | lesson-cancelled-by-school |
| 24h reminder | Student + Teacher | lesson-reminder |
| Manual bank payment activated | Student | manual-activation-confirmation |
| Refund processed | Student | refund-confirmation |

---

## 11. Timezone Handling

- All `DateTime` stored in **UTC**.
- Recurring slot `startHour`/`startMin` stored in **UTC**; teachers enter in their local timezone and the frontend converts before saving.
- Frontend displays all times in the user's browser timezone (`Intl.DateTimeFormat`).
- 12-hour cancellation window enforced server-side in UTC.

---

## 12. Video Course Architecture

### 12.1 Structure

```
VideoCourse → CourseModule (ordered) → VideoLesson (ordered)
  └── vimeoId (manual entry by admin), isPreview, durationSec
```

### 12.2 Access Control

| Visitor Type | Preview lessons | Paid lessons |
|---|---|---|
| Unauthenticated / not purchased | ✅ | 🔒 |
| Purchased (ACTIVE enrollment) | ✅ | ✅ |
| Enrollment REFUNDED | ✅ | 🔒 |
| Admin | ✅ | ✅ |

Vimeo embed URLs returned only if `CourseEnrollment.status = ACTIVE` or `isPreview = true`.

---

## 13. Non-Functional Requirements

| Concern | Requirement |
|---|---|
| Performance | All pages < 2s on 4G mobile |
| Concurrency | DB row locking for slot booking + group enrollment |
| Stale price detection | Cart blocks checkout until re-confirmed |
| Security | bcrypt (cost 12); HTTPS; CSRF via NextAuth |
| Data privacy | PII scoped to authenticated user |
| Audit trail | Transactions, ManualPayments, Refunds are immutable |
| Currency | EUR only |

---

## 14. Phased Delivery Plan

### Phase 1 — Core (MVP)
- Auth (register, login, role redirect)
- Teacher availability: **weekly recurring pattern + 14-day window generation** + manual one-off slots
- Shopping cart (add/remove, coupon, PayPal checkout)
- Private lesson packages purchasable via cart
- Lesson booking, cancellation, completion
- Admin manual bank payment (multi-item)
- Basic student, teacher, admin dashboards
- Email notifications

### Phase 2 — Group & Video
- Group course creation + enrollment via cart
- Video course upload (admin Vimeo IDs), modules, preview lessons
- Video course purchase via cart + player
- Public course catalogue

### Phase 3 — Admin & Finance
- Full admin dashboard (users, pricing, reassignment)
- Finance reports (monthly, per-teacher)
- Admin Refund page
- Coupon system (packages, single lessons, video courses)
- Package expiry extension (manual, admin)

### Phase 4 — Polish
- Group class coupon support
- Student profile (avatar, password change)
- Student progress tracking for video courses
- Improved mobile UX + analytics

---

## 15. Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Currency | **EUR only** |
| 2 | Group class payment | **Via Cart → PayPal** |
| 3 | Teacher recurring availability | **Weekly pattern + 2-week window, in Phase 1** |
| 4 | Video course progress tracking | **Out of scope** — Phase 4+ |
| 5 | Refund flow | **Admin Refund page** — records refund + revokes access; money returned externally |
| 6 | Vimeo uploads | Admin enters **vimeoId manually** in admin UI |
| 7 | Group class coupon support | **Phase 4** |
| 8 | Admin bank payment recording | **In scope Phase 1** — multi-item |
| 9 | Pre-payment order review | **Shopping Cart** |
| 10 | Partial package refunds | **Supported** — Transaction marked PARTIAL_REFUND |
| 11 | API architecture | **Server Actions** for all mutations; only 2 true API routes (NextAuth + PayPal capture) |
