import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User } from '@swago/database';
import { sendNotificationEmail } from '../../../../../web/src/lib/msg91-email';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { userIds, amount, reason } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No users selected' }, { status: 400 });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
        }
        if (!reason || typeof reason !== 'string') {
            return NextResponse.json({ success: false, error: 'Invalid reason' }, { status: 400 });
        }

        const users = await User.find({ _id: { $in: userIds } });
        if (users.length === 0) {
            return NextResponse.json({ success: false, error: 'Users not found' }, { status: 404 });
        }

        let successCount = 0;

        for (const user of users) {
            try {
                // Award Swago Money
                await user.awardSwagoMoney(amount);

                // Send Email Notification
                if (user.email) {
                    const emailHtml = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #eaeaea;">
                            <h2 style="color: #1e3a8a; text-align: center;">Congratulations, ${user.name || 'Swago Fam'}! 🎉</h2>
                            <p style="color: #333; font-size: 16px; line-height: 1.5;">
                                Great news! Your Swago Jr. account has just been credited with <strong>$${amount} Swago Money</strong>.
                            </p>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
                            </div>
                            <p style="color: #333; font-size: 16px; line-height: 1.5;">
                                You can use this money directly towards your next purchase of our premium products!
                            </p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://swagojr.com" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                    Shop Now
                                </a>
                            </div>
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                                If you have any questions, please reply to this email.<br/>
                                © ${new Date().getFullYear()} Swago Jr. All rights reserved.
                            </p>
                        </div>
                    `;

                    await sendNotificationEmail(
                        user.email,
                        user.name || '',
                        '🎉 You just received Swago Money!',
                        emailHtml
                    );
                }

                successCount++;
            } catch (err) {
                console.error(`Failed to process deposit for user ${user._id}:`, err);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully processed ${successCount}/${users.length} deposits.` 
        });

    } catch (error) {
        console.error('Manual Deposit Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
