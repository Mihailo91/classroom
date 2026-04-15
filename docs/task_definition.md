# Technical Specification: Online Language School Platform

---
## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 19+ (App Router) |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| Payments | PayPal REST API (Orders API v2) |
| Video Hosting | Vimeo Pro/Business (embedded player) |
| Deployment | Vercel + Neon/Supabase PostgreSQL |

---

## 1. Project Overview

An mobile first online classroom platform for a specific language school that enable students to have a posibility to see all available video courses and purchase those who they like. There is a discount for those who have coupons. 
Platform should also enable students to purchase and attend 1-on-1 lessons, and sign up for group classes. 
The platform supports three user roles: **Student**, **Teacher**, and **Admin** By default assigned role is strudent. Admin can change a role of a user, set status to idle or no_active. 


## 2. Foundation
There should be a home page with few details for language school and options to login. 
After resgister/login 
student should be redirected to dashbord where he can see in the navbar 3 posible options private lessons, Group lessons and Video courses

teacher should be redirected to dashbord where he can see 3 possible options 
private lessons and group lessons

Admin should be redirected to dashbord where he can see in the navbar 5 posible options private lessons Group lessons, Video courses and User Administation and Finance.

## 3. User Roles

| Role | Description |
|---|---|
| Student | Purchases lessons/packages, books time slots, views history of held lessons. | Scheduled lessons| Active package | Remaining lessongs from the package | expire date of the purchased lesson
| teacher | Manages availability by date and time slots of 50min per single lessons, views earnings in current month and lessons history, manages student sessions | next lessons | Teacher can schedule a class for own students
| Admin | Full platform oversight, financial dashboard, user management |
---

---
 
## 4. Student possibilities
 
### Business need
Student need real-time visibility of private lessons, Group lessons and Video courses
 
### Business rules
- Each student on the private lessons item can se overview of Scheduled lessons, Active package, Remaining lessongs from the package, Expire date of the purchased lesson. Purchases lessons/packages, books time slots, views history of held lessons. 
- On group courses he can see all upcoming group courses and details for each one and sign up for it.
- On video courses page in My couses section student can see purcased courses, an by clicking it should be redirected to course page to watc it. in the other courses student can see availabe courses click on it to see details and if the wants he can buy it.
- on profile page, student can upload own photo, can change password.
-
### Acceptance criteria

 - All should be applied
---

---
 
## 5. Teacher possibilities
 
### Business need
Teacher need real-time visibility of scheduled private lessons. Enter a details about held group lesson and present students.
 
### Business rules
- in overview section teacher can see own active students, number of held lessons number of scheduled lessons and earned sum (price per teacher not school) for current month.
- Teacher on the private lessons item can see section about Scheduled lessons, Listed active student with details about active package remaining lessons and validity.
- Teacher can add available time slots.
- Teacher can schedule a class for a user with active package.
- On group courses he can see all upcoming group lessons and he can add details held lesson and present student.
-
### Acceptance criteria

 - All should be applied
---

## 6. Admin possibilities
 
### Business need
Admin should be redirected to dashbord where he can see in the navbar 5 posible options private lessons Group lessons, Video courses and User Administation and Finance.
 
### Business rules
- in menu item private lessons - admin can have detailed information about private lessons for each teacher.
Here he can reasign student to different teacher or schedule a class for specific teacher and specific student.
- Admin on the group lesson item can create new group course which with relevant information.
  - can define number min and max number of students
  - can define price per course
  - can assign students and teacher to specific group
  - can see section about Scheduled group lessons for each teacher, held and remaining lessons for each grop course
- On video courses admin can view created video courses.
  - In overview section admin can see how many time each course is sold and se revenue for total and current month.
  - He can publish or edit created courses. Admin can adjust a price. 
- in User Administation admin can mark some studen as idle, chage role of the user or change status. 
- in finance item admin can see total earnins for current month prom grop lessons, private lessons, video courses.   
  - For each tracher admin can see what is earning for school and for teacher itself for current month. 
  - Admin can set prices for lessons and packages for specic teacher which is price for school. 
  - Every teacher can have price_per_teacher which should be assinged for specific student. 
  - This price should be used for salary calculation. price_per_teacher X number of lessons held in specific month 

-
### Acceptance criteria

 - All should be applied
---

## 7. Business Rules

### 7.1 Scheduling Lessons
- Teachers define availability, by adding available slots, similar like on callendy
- Students may schedule a lesson
- Timezone handling should be handled
- Conflict prevention when booking
- there should be fields completed lesson for student and for teacher
- Email notifications (booking confirmations, reminders, cancellations)

### 7.2 Cancellation Policy
- Students may cancel a scheduled lesson **up to 12 hours before the scheduled start time** at no cost.
- Cancellations made **less than 12 hours** before the lesson are considered **late cancellations**:
  - The lesson is marked as `cancelled (late)` This operation can be revocad by teacher.
  - No automatic refund is issued. Admin handles refunds manually on a case-by-case basis.
- teachers and Admins may cancel at any time; in this case the lesson is **not deducted** from the student's package.
- `cancelled_at` timestamp is stored on the lesson to enforce the 12-hour rule server-side.

### 7.3 Package Validity

| Package | Lessons | Validity |
|---|---|---|
| Single Class | 1 | No package — lesson must be booked at time of purchase |
| Starter Pack | 4 | 30 days from activation |
| Standard Pack | 8 | 60 days from activation |
| Premium Pack | 12 | 90 days from activation |

- Package activates immediately upon successful payment.
- Unused lessons expire at the end of the validity period (no automatic refund).
- Admin can manually extend a package's expiry date.

### 7.4 Per-teacher Pricing
- Admin can set teacher price per lesson type (single class, 4-pack, 8-pack, 12-pack).
- Since teacher works in the school he earns fixed amount per `lesson price_per_teacher` (it is not exactly the same for all students)
- Prices are stored in `teacher_pricing` column and displayed to students during the purchase flow.
- When a student selects a teacher, the prices shown are that teacher's specific rates.
- ssudets with coupen can have discounts 

### 7.5 Coupons & Promotional Discounts
- The platform supports **coupons** as a promotional discount mechanism.
- Coupons may be applied to:
  - lesson packages
  - single lessons
  - video courses
  - optionally group classes in a later phase
- A coupon may define either:
  - a **percentage discount** (e.g. 10% off), or
  - a **fixed discount amount** (e.g. 15 EUR off)
- Coupons may be limited by:
  - validity period (`valid_from`, `valid_until`)
  - total usage limit
  - per-student usage limit
  - applicable item type (`package`, `single_lesson`, `course`, `group_class`)
- Coupons must be validated **server-side** before order creation.
- Final charged amount, applied discount amount, and coupon code must be stored with the transaction for auditability.
- Coupons are promotional discounts only; they do **not** override cancellation, refund, or package validity rules.

### 7.6 Public Course Previews
- it should be available to upload cover image for a course.
- Courses consists of modules, each modules can have more video lessons.
- Some lessons may be exposed as **public previews** before purchase.
- Preview lessons are marked with a dedicated boolean flag (`is_preview`).
- Non-purchased visitors may:
  - see the full module list,
  - play only lessons marked as previews,
  - see all other lessons as locked content.
- Purchased students keep access to all modules and lessons through the protected learning area.
- Preview playback is intended for marketing and conversion; it does **not** grant paid-course access.
- Preview playback should not create student progress records unless preview analytics are explicitly introduced later.

---
