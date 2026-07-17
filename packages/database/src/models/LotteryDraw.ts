// packages/database/src/models/LotteryDraw.ts

import mongoose from "mongoose";

const LotteryDrawSchema = new mongoose.Schema(
    {
        // Draw identifier - DRAW-2026-W05 (year-week)
        drawNumber: {
            type: String,
            required: true,
            unique: true,
        },

        // Draw window - Thursday 7PM to next Thursday 7PM IST
        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        // Winner announcement date - Friday 7PM IST
        drawDate: {
            type: Date,
            required: true,
        },

        // Draw type
        drawType: {
            type: String,
            enum: ["weekly", "custom"],
            default: "weekly",
        },

        // Draw status
        status: {
            type: String,
            enum: ["open", "closed", "drawn"],
            default: "open",
        },

        // Total eligible tickets count
        totalTickets: {
            type: Number,
            default: 0,
        },

        // Winner details (legacy, kept for fallback)
        winner: {
            kidProfileId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            kidName: String,
            ticketCode: String,
            ticketProductName: String,
            parentPhone: String,
            parentEmail: String,
            announcedAt: Date,
            announcedBy: String,
        },

        // Multiple winners details
        winners: [{
            kidProfileId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            kidName: String,
            ticketCode: String,
            ticketProductName: String,
            parentPhone: String,
            parentEmail: String,
            announcedAt: Date,
            announcedBy: String,
            rewardAmount: Number,
        }],

        // Admin notes
        notes: {
            type: String,
        },
    },
    {
        timestamps: true
    }
);

// Helper to generate draw number from date (standalone function)
function generateDrawNumber(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `DRAW-${year}-W${String(week).padStart(2, '0')}`;
}

// Expose as static method
LotteryDrawSchema.statics.generateDrawNumber = generateDrawNumber;

// Helper to get or create current draw
LotteryDrawSchema.statics.getCurrentOrCreateDraw = async function () {
    const now = new Date();

    // Eligibility Cutoff: Wednesday 8:00 PM IST (14:30 UTC)
    // Draw/Announcement: Friday 7:00 PM IST (13:30 UTC)

    const getThisWeeksWednesday8PM = (from: Date): Date => {
        const d = new Date(from);
        const day = d.getDay();
        // Move to Wednesday (3)
        const diff = (day >= 4 || (day === 3 && d.getUTCHours() >= 14 && d.getUTCMinutes() >= 30)) ? 10 - day : 3 - day;
        // Wait, a simpler way: find the Wednesday of the current cycle.
        // If today is Mon, Tue, early Wed -> this Wed.
        // If today is late Wed, Thu, Fri, Sat, Sun -> next Wed.

        const Wednesday = new Date(from);
        const daysToWed = (3 - Wednesday.getDay() + 7) % 7;
        Wednesday.setDate(Wednesday.getDate() + daysToWed);
        Wednesday.setUTCHours(14, 30, 0, 0); // 8:00 PM IST

        if (Wednesday < from) {
            Wednesday.setDate(Wednesday.getDate() + 7);
        }
        return Wednesday;
    };

    const endDate = getThisWeeksWednesday8PM(now);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    // Draw Date is the Friday following the Wednesday cutoff
    const drawDate = new Date(endDate);
    drawDate.setDate(drawDate.getDate() + 2); // Wed + 2 = Fri
    drawDate.setUTCHours(13, 30, 0, 0); // 7:00 PM IST

    const drawNumber = generateDrawNumber(endDate);

    // Try to find existing draw
    let draw = await this.findOne({ drawNumber });

    if (!draw) {
        // Create new draw
        draw = await this.create({
            drawNumber,
            startDate,
            endDate,
            drawDate,
            status: "open",
            totalTickets: 0,
        });
    }

    return draw;
};

const LotteryDraw =
    mongoose.models.LotteryDraw ||
    mongoose.model("LotteryDraw", LotteryDrawSchema);

export default LotteryDraw;
