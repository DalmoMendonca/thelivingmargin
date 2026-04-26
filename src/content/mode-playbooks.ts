import type { ContentMode } from "../types.js";

interface ModeExemplar {
  title: string;
  imageDirection: string;
  captionDirection: string;
  whyItWorks: string;
}

interface DraftLane {
  name: string;
  instruction: string;
}

export interface ModePlaybook {
  plannerQuestions: string[];
  draftLanes: DraftLane[];
  rubricEmphasis: string[];
  exemplars: ModeExemplar[];
}

export const modePlaybooks: Record<ContentMode, ModePlaybook> = {
  aphorism: {
    plannerQuestions: [
      "What is the exact social translation people wish they had for this dynamic?",
      "What concrete noun can keep the line from floating into generic wisdom?",
      "What is the one phrase that makes the line screenshot-worthy?"
    ],
    draftLanes: [
      {
        name: "recognition",
        instruction:
          "Write the version people feel in their stomach immediately because it names a familiar self-deception in plain language."
      },
      {
        name: "embarrassment",
        instruction:
          "Write the version with mild social embarrassment or vanity pressure so it feels lived instead of polished."
      },
      {
        name: "translation",
        instruction:
          "Write the version that translates soft, misleading language into the harder truth underneath it."
      }
    ],
    rubricEmphasis: [
      "The headline must feel quotable without sounding like a calendar quote.",
      "The body should clarify the line, not become a second headline.",
      "The post should leave behind one repeatable phrase."
    ],
    exemplars: [
      {
        title: "Hope's Favorite Translation",
        imageDirection:
          "You keep calling them busy because [[not interested]] would rearrange your hope.",
        captionDirection:
          "Explain how temporary language protects a fantasy longer than a clean answer would.",
        whyItWorks:
          "It compresses denial into one concrete emotional move instead of offering general dating advice."
      },
      {
        title: "Clean Apology",
        imageDirection:
          "A clean apology is shorter than the defense.",
        captionDirection:
          "Shift from the line itself to the deeper conflict between absolution and repair.",
        whyItWorks:
          "It sounds spoken, specific, and socially useful instead of wise for its own sake."
      }
    ]
  },
  advice: {
    plannerQuestions: [
      "What tactic can the reader actually test in one conversation or one workday?",
      "What failure mode makes this advice necessary in real life?",
      "What concrete sentence, script, or rule-of-thumb would make the post more actionable?"
    ],
    draftLanes: [
      {
        name: "script",
        instruction:
          "Write the version anchored in one sentence or script the reader could actually say this week."
      },
      {
        name: "field test",
        instruction:
          "Write the version that stress-tests the advice under messy real-life conditions rather than ideal ones."
      },
      {
        name: "warning",
        instruction:
          "Write the version that shows the hidden cost of weak advice before offering the stronger alternative."
      }
    ],
    rubricEmphasis: [
      "Every slide or sentence must add usable guidance, not mood.",
      "The advice should survive a tired Tuesday, not just a notebook.",
      "The caption should add a practical edge case or application."
    ],
    exemplars: [
      {
        title: "Clarity Sounds Rude",
        imageDirection:
          "Replace 'we should' with a name, a verb, and a date.",
        captionDirection:
          "Explain why vague rooms confuse politeness with progress.",
        whyItWorks:
          "It gives a concrete move and names the social pressure that makes the move feel difficult."
      },
      {
        title: "Tuesday Advice",
        imageDirection:
          "If the advice sounds elegant, test it in a [[Tuesday mood]].",
        captionDirection:
          "Move from elegance to usefulness under noise, fatigue, and friction.",
        whyItWorks:
          "It keeps the post practical while still sounding authored and sharp."
      }
    ]
  },
  story: {
    plannerQuestions: [
      "What is the precise disruption on page one?",
      "Which two or three details make the scene feel believable rather than engineered?",
      "What human action in the middle earns the emotional release at the end?"
    ],
    draftLanes: [
      {
        name: "institutional mercy",
        instruction:
          "Write the version where a person inside a rigid system bends a small rule for a human reason."
      },
      {
        name: "quiet witness",
        instruction:
          "Write the version where the emotional force comes from restraint and observed detail, not melodrama."
      },
      {
        name: "afterglow",
        instruction:
          "Write the version where page three lingers on what changed emotionally after the event, without preaching."
      }
    ],
    rubricEmphasis: [
      "The story must feel plausible enough that a skeptical reader could still believe it.",
      "The caption should name what made the moment matter, not retell every beat.",
      "The ending should resolve with afterglow, not a miracle or sermon."
    ],
    exemplars: [
      {
        title: "Eleven Minutes",
        imageDirection:
          "Late visitor, closed hospital floor, night nurse who says 'give me two minutes.'",
        captionDirection:
          "Frame the story around people who know which rules can bend without breaking what matters.",
        whyItWorks:
          "It is emotionally clear but small enough to feel witnessed rather than cinematic."
      },
      {
        title: "Address on the Receipt",
        imageDirection:
          "A man at a pharmacy counter forgets his address and a cashier helps him rebuild it through landmarks.",
        captionDirection:
          "Name the quiet dignity of practical help without overpraising kindness.",
        whyItWorks:
          "It keeps the pathos inside behavior and dialogue instead of moral explanation."
      }
    ]
  },
  quote: {
    plannerQuestions: [
      "Is the quote short enough to fit beautifully and worth borrowing at all?",
      "What current pressure makes this quote feel newly useful?",
      "What commentary can sharpen the quote without sounding reverent?"
    ],
    draftLanes: [
      {
        name: "ordinary life",
        instruction:
          "Write the commentary that pulls the quote out of admiration and into ordinary Tuesday behavior."
      },
      {
        name: "counterweight",
        instruction:
          "Write the version where your commentary pushes against the most obvious way people usually misuse the quote."
      },
      {
        name: "application",
        instruction:
          "Write the version that gives the quote a present-day object, pressure, or habit to bite into."
      }
    ],
    rubricEmphasis: [
      "The quote must be real, short, and certainly attributed.",
      "The commentary should feel sharper than a fan account.",
      "The image should foreground the quote; the caption should justify why it matters now."
    ],
    exemplars: [
      {
        title: "Tuesday Is the Life",
        imageDirection:
          "\"How we spend our days is, of course, how we spend our lives.\" - Annie Dillard",
        captionDirection:
          "Use Tuesday as the test case instead of talking about the quote in general.",
        whyItWorks:
          "It makes a famous line feel specific again by attaching it to repetition."
      },
      {
        title: "Keep the Room Lit",
        imageDirection:
          "\"Attention is the rarest and purest form of generosity.\" - Simone Weil",
        captionDirection:
          "Move from admiration to the concrete cost of distracted presence.",
        whyItWorks:
          "It reframes the quote as a behavioral demand rather than something pretty to repost."
      }
    ]
  },
  encouragement: {
    plannerQuestions: [
      "What exact burden or fear is being softened?",
      "What permission can be granted without sounding childish or vague?",
      "What clarifying truth keeps the comfort from turning to syrup?"
    ],
    draftLanes: [
      {
        name: "permission",
        instruction:
          "Write the version where the main gift is a clean, adult permission the reader rarely gives themselves."
      },
      {
        name: "relief",
        instruction:
          "Write the version that lowers shame or panic without pretending the underlying problem is solved."
      },
      {
        name: "earned softness",
        instruction:
          "Write the version that feels warm because it is precise, not because it is mushy."
      }
    ],
    rubricEmphasis: [
      "The comfort should feel directed at a bruised adult, not a generic audience.",
      "The post must include a real object of permission or relief.",
      "The caption should add one clarifying truth that keeps the tone adult."
    ],
    exemplars: [
      {
        title: "Before the Crash",
        imageDirection:
          "You are allowed to rest before you become impossible to live with.",
        captionDirection:
          "Shift from permission to the practical cost of waiting too long.",
        whyItWorks:
          "It is comforting because it is blunt and useful, not because it flatters the reader."
      },
      {
        title: "No Collapse Required",
        imageDirection:
          "You do not need a collapse to justify a chair.",
        captionDirection:
          "Explain how dramatic breakdowns become false proof that rest is deserved.",
        whyItWorks:
          "It compresses relief into a memorable line while staying unsentimental."
      }
    ]
  },
  observation: {
    plannerQuestions: [
      "What modern behavior, phrase, or ritual is being observed?",
      "What social convenience hides inside the behavior?",
      "What specific line or scene can keep the observation from floating?"
    ],
    draftLanes: [
      {
        name: "social ritual",
        instruction:
          "Write the version anchored in a recognizable phrase or ritual people hear all the time."
      },
      {
        name: "translation",
        instruction:
          "Write the version that translates a polite modern behavior into the motive it often protects."
      },
      {
        name: "scene",
        instruction:
          "Write the version that begins in a public scene and only later names the pattern it reveals."
      }
    ],
    rubricEmphasis: [
      "The observation should feel current and recognizable, not like a timeless truism.",
      "The copy should prefer social texture over abstraction.",
      "The caption should push one click deeper rather than restate the visible pattern."
    ],
    exemplars: [
      {
        title: "Busy Language",
        imageDirection:
          "At brunch, everyone said they were 'bad at texting.' Nobody sounded guilty. Just booked.",
        captionDirection:
          "Move from the phrase itself to the way intentions replace contact.",
        whyItWorks:
          "It grounds the thesis in a public scene before widening to the social pattern."
      },
      {
        title: "Warmth and Presence",
        imageDirection:
          "Warmth is not always presence.",
        captionDirection:
          "Define the difference through weight-bearing contact rather than temperature.",
        whyItWorks:
          "It takes a fuzzy relationship complaint and makes it behaviorally legible."
      }
    ]
  },
  question: {
    plannerQuestions: [
      "What tradeoff or lie should the question expose?",
      "What support lines make the question sharper without answering it?",
      "What phrasing makes the question costly instead of therapeutic?"
    ],
    draftLanes: [
      {
        name: "tradeoff",
        instruction:
          "Write the version where the question exposes what the reader is buying with the behavior."
      },
      {
        name: "misnaming",
        instruction:
          "Write the version where the question catches the reader calling one thing by a safer name."
      },
      {
        name: "self-betrayal",
        instruction:
          "Write the version where the question points to something the reader is still carrying or protecting unnecessarily."
      }
    ],
    rubricEmphasis: [
      "The question must be singular, sharp, and answerable in real life.",
      "Support text should deepen the cost, not diffuse the pressure.",
      "The comment question should feel native, not bolted on."
    ],
    exemplars: [
      {
        title: "Old Yeses",
        imageDirection:
          "What are you still carrying just because you [[said yes once]]?",
        captionDirection:
          "Shift from endurance to whether the commitment still belongs in the life being built now.",
        whyItWorks:
          "It exposes a tradeoff and an identity lag in one sentence."
      },
      {
        title: "Hardest Thing",
        imageDirection:
          "What feels hardest to do after you already know it matters?",
        captionDirection:
          "Name the difference between truth-seeking and relief-seeking.",
        whyItWorks:
          "It makes a reflective prompt feel pointed instead of generic."
      }
    ]
  },
  reframe: {
    plannerQuestions: [
      "What is the default interpretation the reader is using now?",
      "What new frame is actually more useful in lived life?",
      "How can the turn land cleanly without feeling like a gimmick?"
    ],
    draftLanes: [
      {
        name: "diagnosis",
        instruction:
          "Write the version where changing the label changes what kind of action or mercy becomes possible."
      },
      {
        name: "counterframe",
        instruction:
          "Write the version where the replacement frame feels surprising but immediately more accurate."
      },
      {
        name: "behavioral test",
        instruction:
          "Write the version that gives the reader a practical way to tell the old frame from the new one."
      }
    ],
    rubricEmphasis: [
      "The new frame must change meaning, not just wording.",
      "The turn should sound clean enough to repeat aloud.",
      "The caption should explain the practical consequence of the reframe."
    ],
    exemplars: [
      {
        title: "Planner-Shaped Resentment",
        imageDirection:
          "Maybe it isn't procrastination. Maybe it's [[resentment]] with office clothes on.",
        captionDirection:
          "Explain how the diagnosis changes the remedy.",
        whyItWorks:
          "It is vivid, useful, and specific without becoming theatrical."
      },
      {
        title: "Quiet Beginning",
        imageDirection:
          "What if 'quiet quitting' is a quiet beginning pointed at the wrong thing?",
        captionDirection:
          "Push from withdrawal as failure toward mis-aimed energy.",
        whyItWorks:
          "It takes a familiar cliche and finds a sharper human interpretation."
      }
    ]
  },
  dialogue: {
    plannerQuestions: [
      "What mismatch or truth becomes visible only through the exchange itself?",
      "Which one or two lines need to sound unmistakably spoken?",
      "What subtext should the final slide leave hanging?"
    ],
    draftLanes: [
      {
        name: "misheard promise",
        instruction:
          "Write the version where one line changes meaning once the listener finally hears it correctly."
      },
      {
        name: "quiet rupture",
        instruction:
          "Write the version where the exchange feels calm on the surface but reveals a deeper mismatch underneath."
      },
      {
        name: "translation",
        instruction:
          "Write the version where slide two translates what one loaded phrase actually means in the relationship."
      }
    ],
    rubricEmphasis: [
      "At least one quoted line must sound like a real person actually said it.",
      "Each slide should advance the emotional meaning of the exchange.",
      "The caption should explain what the exchange revealed rather than narrating stage directions."
    ],
    exemplars: [
      {
        title: "What I'll Try Means",
        imageDirection:
          "\"Are you still coming?\" / \"I said I'd try.\"",
        captionDirection:
          "Translate the phrase into asymmetry of hope and responsibility.",
        whyItWorks:
          "It dramatizes ambiguity with ordinary language rather than polished banter."
      },
      {
        title: "Not Mad",
        imageDirection:
          "\"I'm not mad,\" she said. \"I know,\" he said. \"That's the problem.\"",
        captionDirection:
          "Pull out the resignation or withdrawal hidden under calm language.",
        whyItWorks:
          "It lets dialogue carry the truth instead of explaining it first."
      }
    ]
  },
  list: {
    plannerQuestions: [
      "What promise makes the reader want all five slides?",
      "Are the middle items genuinely distinct or just restatements?",
      "What synthesis on the last slide turns the list into a bigger idea?"
    ],
    draftLanes: [
      {
        name: "signs",
        instruction:
          "Write the version as a diagnostic list where each item helps the reader recognize themselves faster."
      },
      {
        name: "rules",
        instruction:
          "Write the version as practical rules or tests that can be applied in the next week."
      },
      {
        name: "mistakes",
        instruction:
          "Write the version where each item names a common mistake and the last slide reframes the whole pattern."
      }
    ],
    rubricEmphasis: [
      "Slide one must make a compelling promise and slides two to four must each earn their slot.",
      "The final slide must synthesize, not merely repeat.",
      "The caption should add one nuance or omitted edge case rather than summarizing the list."
    ],
    exemplars: [
      {
        title: "Improvement as Camouflage",
        imageDirection:
          "5 signs your self-improvement plan is protecting you from being seen.",
        captionDirection:
          "Explain how real growth becomes honest the moment it touches consequence or exposure.",
        whyItWorks:
          "The list items are diagnostic, distinct, and culminate in a stronger concluding frame."
      },
      {
        title: "Three Rules for Naming Delay",
        imageDirection:
          "3 ways to tell whether your delay is fear, confusion, or refusal.",
        captionDirection:
          "Add one omitted edge case about mixed motives and partial truth.",
        whyItWorks:
          "It gives a scannable promise and a practical sorting framework."
      }
    ]
  }
};
