// apps/web/src/app/api/blogs/seed/route.ts
import { NextResponse } from "next/server";
import { Blog, connectDB } from "@swago/database";

export async function GET() {
    try {
        await connectDB();

        // Delete existing blog with this slug so we can refresh the content
        await Blog.deleteOne({ slug: "child-brain-quiz" });

        const defaultBlog = {
            title: "How Does Your Child's Brain Really Work? (Take This 2-Minute Quiz to Find Out)",
            slug: "child-brain-quiz",
            metaDescription: "Wondering why your child reacts the way they do? Take this free 2-minute child personality quiz to understand your child's brain type—and learn how to build their focus, confidence, and emotional strength.",
            coverImage: "/images/blog/child-brain-quiz.png",
            isPublished: true,
            author: "Swago",
            content: [
                { type: "paragraph", data: { text: "Every parent has had a moment like this. You’re standing in the grocery store line. Your child sees a candy bar. You gently say 'no'... and suddenly it feels like the whole world has ended right there." } },
                { type: "paragraph", data: { text: "Or sometimes it’s the opposite. You say no, and your child just shrugs and moves on like it’s no big deal. Same situation. Completely different reactions." } },
                { type: "paragraph", data: { text: "And in that moment, many parents quietly wonder: 'Why does my child react like this?'" } },
                { type: "paragraph", data: { text: "The truth is, most children are not trying to be difficult. They’re simply reacting in the way their brain naturally works." } },
                { type: "paragraph", data: { text: "Every child handles things differently—waiting, frustration, mistakes, or new challenges. Some children stay calm, some get upset quickly, and some need a little more time to adjust." } },
                { type: "paragraph", data: { text: "And that’s normal. When parents start to understand how their child naturally reacts to situations, it becomes much easier to guide them, support them, and help them grow with confidence." } },
                { type: "paragraph", data: { text: "That’s exactly what this short child personality quiz is designed to help you explore." } },

                { type: "heading", data: { text: "Why Understanding Your Child’s Brain Style Matters", level: 2 } },
                { type: "paragraph", data: { text: "Child development research consistently shows that children develop skills at different rates." } },
                {
                    type: "list", data: {
                        type: "unordered", items: [
                            "Support confidence development",
                            "Improve focus and self-control",
                            "Encourage healthy emotional regulation",
                            "Guide learning more effectively"
                        ]
                    }
                },
                { type: "paragraph", data: { text: "Instead of labeling children as 'good' or 'difficult,' this approach helps parents understand how their child’s brain works." } },

                { type: "heading", data: { text: "The 3 Key Abilities This Quiz Explores", level: 2 } },
                {
                    type: "list", data: {
                        type: "ordered", items: [
                            "Executive Function: This is the brain’s ability to plan, focus attention, remember instructions, and control impulses.",
                            "Emotional Regulation: This refers to how children manage frustration, disappointment, and unexpected changes.",
                            "Confidence & Mindset: This reflects how children approach challenges, mistakes, and learning experiences."
                        ]
                    }
                },

                { type: "heading", data: { text: "How the Quiz Works", level: 2 } },
                { type: "paragraph", data: { text: "For each situation below, choose the option that best describes your child’s usual reaction. Keep track of your points: A = 3 points, B = 2 points, C = 1 point. At the end, add up your total score to discover your child’s Brain Style profile." } },

                {
                    type: "quiz", data: {
                        title: "Child Personality Quiz",
                        questions: [
                            { question: "1. er. Their reaction?", options: [{ text: "A) Finds a toy and waits patiently", points: 3 }, { text: "B) Ask every 2 minutes if it’s ready", points: 2 }, { text: "C) Has an emotional collapse", points: 1 }] },
                            { question: "2. You are on an important phone call.", options: [{ text: "A) They play quietly until you are done", points: 3 }, { text: "B) They wait a few minutes, then tap you", points: 2 }, { text: "C) They shout or stand in front of you instantly", points: 1 }] },
                            { question: "3. You say: 'Socks on, brush teeth, get your bag.'", options: [{ text: "A) They complete all three independently", points: 3 }, { text: "B) They do one task, then get distracted", points: 2 }, { text: "C) They forget the list and start playing", points: 1 }] },
                            { question: "4. You say, 'Stay right next to me' in a busy store.", options: [{ text: "A) They stay right beside you", points: 3 }, { text: "B) They drift away but return when called", points: 2 }, { text: "C) They run toward something interesting", points: 1 }] },
                            { question: "5. You give a 5-minute warning to stop playing.", options: [{ text: "A) They begin wrapping up their game", points: 3 }, { text: "B) They ignore the warning until time is up", points: 2 }, { text: "C) They refuse to stop and say it’s unfair", points: 1 }] },
                            { question: "6. You say no to a treat at the checkout.", options: [{ text: "A) They accept it and move on", points: 3 }, { text: "B) They try to negotiate", points: 2 }, { text: "C) It leads to a meltdown", points: 1 }] },
                            { question: "7. They cannot snap a toy together.", options: [{ text: "A) They take a breath and try again", points: 3 }, { text: "B) They ask you to fix it", points: 2 }, { text: "C) They throw the toy or scream", points: 1 }] },
                            { question: "8. The park is closed so you must go home.", options: [{ text: "A) They accept the change", points: 3 }, { text: "B) They stay moody for a while", points: 2 }, { text: "C) The whole day feels ruined", points: 1 }] },
                            { question: "9. You are in a busy and noisy environment.", options: [{ text: "A) They stay calm and follow you", points: 3 }, { text: "B) They become overly energetic", points: 2 }, { text: "C) They shut down or cry", points: 1 }] },
                            { question: "10. They lose a simple race or game.", options: [{ text: "A) They laugh and ask for another try", points: 3 }, { text: "B) They pout briefly", points: 2 }, { text: "C) They refuse to play again", points: 1 }] },
                            { question: "11. You suggest trying a new hobby.", options: [{ text: "A) They want to try immediately", points: 3 }, { text: "B) They watch first before joining", points: 2 }, { text: "C) They say they are bad at it", points: 1 }] },
                            { question: "12. They receive a puzzle.", options: [{ text: "A) They enjoy solving it", points: 3 }, { text: "B) They only work if you help", points: 2 }, { text: "C) They say it’s boring", points: 1 }] },
                            { question: "13. You ask them to show a drawing to a relative.", options: [{ text: "A) They proudly explain it", points: 3 }, { text: "B) They show it shyly", points: 2 }, { text: "C) They hide it", points: 1 }] },
                            { question: "14. They are stuck on a difficult task.", options: [{ text: "A) They try different solutions first", points: 3 }, { text: "B) They ask for help immediately", points: 2 }, { text: "C) They wait silently for help", points: 1 }] },
                            { question: "15. You show them a better way to hold a pencil.", options: [{ text: "A) They adjust and continue", points: 3 }, { text: "B) They try but feel annoyed", points: 2 }, { text: "C) They stop the activity", points: 1 }] }
                        ]
                    }
                },

                { type: "heading", data: { text: "How Play and Activities Strengthen These Skills", level: 2 } },
                { type: "paragraph", data: { text: "Research in child development shows that structured play helps children strengthen important abilities such as focus, confidence, emotional resilience, and problem solving." } },

                { type: "heading", data: { text: "How to Build Your Child's Focus, Confidence, and Emotional Strength", level: 2 } },
                { type: "paragraph", data: { text: "That's exactly the gap that SWAGO was built to fill. SWAGO is a gamified skill-building system for kids that turns everyday play into real growth." } },
                { type: "paragraph", data: { text: "Instead of worksheets and lectures, children progress through skill levels like a game — where every activity is quietly training the exact abilities this quiz measures." } }
            ]
        };

        const blog = await Blog.create(defaultBlog);
        return NextResponse.json({ success: true, blog });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
