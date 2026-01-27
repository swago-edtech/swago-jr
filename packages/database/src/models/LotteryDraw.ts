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

        // Winner details (populated when drawn)
        winner: {
            kidProfileId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "KidProfile",
            },
            kidName: String,
            ticketCode: String,
            ticketProductName: String,
            parentPhone: String,
            parentEmail: String,
            announcedAt: Date,
            announcedBy: String,
        },

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

    // Find the most recent Thursday 7PM IST
    // IST is UTC+5:30, so 7PM IST = 13:30 UTC
    const getLastThursday7PM = (from: Date): Date => {
        const d = new Date(from);
        // Set to 13:30 UTC (7PM IST)
        d.setUTCHours(13, 30, 0, 0);

        // Find the previous Thursday
        while (d.getDay() !== 4 || d > from) {
            d.setDate(d.getDate() - 1);
        }
        return d;
    };

    const startDate = getLastThursday7PM(now);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const drawDate = new Date(startDate);
    drawDate.setDate(drawDate.getDate() + 1); // Friday

    const drawNumber = generateDrawNumber(startDate);

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
