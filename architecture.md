1. Donor
- id
- fullName
- phone
- email
- cnicNumber
- passwordHash
- isEmailVerified
- emailVerificationToken
- emailVerificationExpires
- passwordResetToken
- passwordResetExpires
- bloodGroup
- city
- area
- latitude
- longitude
- isAvailable
- isVerified
- agreedToTermsAt
- createdAt
- updatedAt

2. DonorDocument
- id
- donorId
- type (CNIC front / CNIC back)
- fileUrl
- status (pending / verified / rejected)
- uploadedAt
- reviewedAt
- reviewedBy
- rejectionReason

3. BloodTestReport
- id
- donorId
- reportUrl
- bloodGroup
- uploadedAt
- expiresAt
- status (active / expired)

4. EmailLog
- id
- donorId
- type (confirmation / reminder / congratulations)
- sentAt
- metadata

5. BloodRequest
- id
- requesterName
- requesterPhone
- requesterEmail
- bloodGroup
- city
- area
- status (pending / contacted / fulfilled)
- createdAt

6. Session
- id
- donorId
- refreshTokenHash
- expiresAt
- createdAt