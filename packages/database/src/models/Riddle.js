import mongoose from "mongoose";

const RiddleSchema = new mongoose.Schema({
  question: String,
  answer: String,
  difficulty: { type: String, default: "medium" }, // optional
});

export default mongoose.models.Riddle || mongoose.model("Riddle", RiddleSchema);
