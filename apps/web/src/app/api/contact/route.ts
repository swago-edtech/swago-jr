import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ContactSubmission } from '@swago/database';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required').max(15),
  subject: z.enum(['product', 'order', 'shipping', 'general', 'other']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error.issues[0].message 
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, subject, message } = validation.data;

    // Connect to database
    await connectDB();

    // Create contact submission
    const submission = await ContactSubmission.create({
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      status: 'pending',
    });

    console.log('Contact form submitted:', {
      id: submission._id,
      name: `${firstName} ${lastName}`,
      email,
      subject,
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you soon.',
    });
  } catch (error: unknown) {
    console.error('Contact form submission error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to submit your message. Please try again later.' 
      },
      { status: 500 }
    );
  }
}
