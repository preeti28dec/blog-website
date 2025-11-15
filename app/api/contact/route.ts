import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
});

// Contact email address
const CONTACT_EMAIL = "officialpreetithakur@gmail.com";

// POST send contact email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Try to send email using nodemailer if available
    let emailSent = false;
    try {
      const nodemailer = await import("nodemailer");
      
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
        },
      });

      // Email content
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_USER || validatedData.email,
        to: CONTACT_EMAIL,
        subject: `New Contact Form Submission from ${validatedData.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${validatedData.name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${validatedData.email}">${validatedData.email}</a></p>
              <p style="margin: 10px 0;"><strong>Message:</strong></p>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap;">
                ${validatedData.message}
              </div>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This email was sent from the contact form on your blog website.
            </p>
          </div>
        `,
        replyTo: validatedData.email,
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // If email fails, we'll still log it and return success to user
      // In production, you might want to use a service like SendGrid, Resend, etc.
    }

    // Log the contact submission
    console.log("Contact form submission:", {
      name: validatedData.name,
      email: validatedData.email,
      message: validatedData.message,
      emailSent,
      contactEmail: CONTACT_EMAIL,
    });

    return NextResponse.json({
      message: "Thank you for your message! We'll get back to you soon.",
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}



