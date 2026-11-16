import type { CoachContent } from '../conversation/types';

/**
 * DRAFT COPY. Written to the Apologist voice rules, not yet reviewed for theology or tone.
 * Every script carries `draft: true`, and the app shows a "Draft copy" note while any script
 * it is showing is still a draft. Set `draft: false` on a script once the team has reviewed it.
 *
 * Scripts are used when live AI is off. They cannot respond to what a person says, so:
 * - the skeptic's follow-ups are fixed lines that fit the question, in order;
 * - Coach help is general help for the question, not for one reply;
 * - the review holds general notes. It never claims to know what the person covered.
 *
 * Strings marked (board) come from the design board word for word.
 */

export interface Script {
  draft: boolean;
  /** The skeptic's first message. */
  opening: string;
  /** The skeptic's reply after the person's reply 1, 2, 3 and 4. */
  replies: [string, string, string, string];
  coach: CoachContent;
  review: { couldAdd: string; possibleAnswer: string };
}

/** The skeptic's last line, after the fifth reply. (board) */
export const CLOSING = 'I need to think about that. Thanks for the talk.';

export const SCRIPTS: Record<string, Script> = {
  suffering: {
    draft: true,
    opening: 'If God is good and strong, why is there so much pain?', // (board)
    replies: [
      'That does not explain a child who gets sick.', // (board)
      'So God could stop it and chooses not to. How is that good?',
      "People say it's all part of a plan. That sounds cold when you're the one hurting.",
      'Then what do you actually say to someone in the middle of it?',
    ],
    coach: {
      nudge: 'Name what the skeptic is really asking: why this pain, not just any pain.', // (board)
      outline:
        "Agree that the pain is real.\nSay what you don't know.\nPoint to a God who entered suffering, not one who watched from a distance.\nAsk what is behind the question for them.",
      sample:
        "I won't pretend that makes sense of a sick child. I don't know why God allows each thing. What I hold on to is that God did not stay far from pain. In Jesus he stepped into it. Can I ask if this question is personal for you?",
    },
    review: {
      couldAdd: 'Ask what is behind the question.', // (board)
      possibleAnswer: 'Pain is real. A good God can allow it for reasons we only partly see.', // (board)
    },
  },

  'unanswered-prayer': {
    draft: true,
    opening: "I prayed for my dad to get better. He didn't. Why should I think anyone was listening?",
    replies: [
      "People tell me God's answer was just no. That feels like a way to never be wrong.",
      "If he already knows what he'll do, what is the point of asking?",
      'Other people say their prayers got answered. Why them and not me?',
      'So what would you have me do with that anger?',
    ],
    coach: {
      nudge: 'Hear the loss before the logic. This is grief asking a question.',
      outline:
        "Say you are sorry, and mean it.\nAdmit you can't explain this outcome.\nPrayer is a relationship, not a machine.\nThe Bible includes honest, angry prayers too.",
      sample:
        "I'm sorry about your dad. I can't tell you why he wasn't healed, and I won't guess. I don't think prayer works like a machine where the right words get the right result. The Bible has people praying in anger and grief, and God does not turn them away. I think he can take yours.",
    },
    review: {
      couldAdd: 'Leave room for silence. You do not have to fill it with reasons.',
      possibleAnswer:
        "I don't know why that prayer was not answered the way you asked. I believe God heard it, and that he is near to people in grief.",
    },
  },

  bible: {
    draft: true,
    opening: 'The Bible was written by people thousands of years ago. Why would I trust it?',
    replies: [
      "It's been copied and translated so many times. Isn't it like a game of telephone?",
      'The writers were believers. Of course they made Jesus look good.',
      "Even if the text is old, that doesn't make what it says true.",
      'So where would you tell someone like me to start?',
    ],
    coach: {
      nudge: 'Find out which worry is underneath: the copying, the authors, or the claims.',
      outline:
        'Translations go back to early manuscripts, not copy to copy to copy.\nThere are many early copies to compare.\nThe writers say they report what was seen, and include details that embarrass them.\nInvite them to read one Gospel and judge for themselves.',
      sample:
        "That's a fair thing to ask. It isn't quite like telephone, because modern translations go back to early manuscripts, and there are many copies to compare against each other. That doesn't prove what it says is true. It does mean we can be confident about what the writers wrote. If you want to test it, read one of the Gospels and see what you make of Jesus.",
    },
    review: {
      couldAdd: 'Separate two questions: is the text reliable, and is the message true.',
      possibleAnswer:
        'We can know with good confidence what the original writers wrote. Whether to trust what they say is a second question, and reading a Gospel is a good way to weigh it.',
    },
  },

  contradictions: {
    draft: true,
    opening: 'The Bible contradicts itself all over the place. How can you take it seriously?',
    replies: [
      "The Gospels can't even agree on who was at the tomb.",
      'Calling them different perspectives sounds like an excuse.',
      'What about the parts that are just plainly violent or strange?',
      'If you found a real contradiction, would it change anything for you?',
    ],
    coach: {
      nudge: "Ask for a specific example. A general charge can't be answered. A specific one can.",
      outline:
        'Ask which passage they have in mind.\nDifferent details are not the same as a contradiction. Witnesses often differ on details and agree on the event.\nAdmit that some passages are hard.\nOffer to look at one together.',
      sample:
        "Which one bothers you most? I'd rather look at a real example than argue in general. When accounts differ on details, like how many women are named at the tomb, that is what you'd expect from separate witnesses, and they agree on the main event. Some passages are hard, and I won't pretend otherwise. I'm happy to look at one with you.",
    },
    review: {
      couldAdd: 'Admit which passages you find hard yourself. Honesty earns trust.',
      possibleAnswer:
        'Differences in detail between accounts are not the same as contradictions. The fair test is to take one specific passage and look at it closely.',
    },
  },

  resurrection: {
    draft: true,
    opening: 'Dead people stay dead. Why would I believe Jesus came back?',
    replies: [
      'Stories grow over time. Maybe the legend just built up.',
      'Maybe the disciples made it up, or only thought they saw him.',
      'People die for false beliefs all the time.',
      'Even if something strange happened, why does it have to be God?',
    ],
    coach: {
      nudge: 'Agree with the starting point. Dead people do stay dead, which is why this claim matters.',
      outline:
        'Agree it would take something beyond nature.\nThe claim was public and early, in the city where he was killed.\nThe first witnesses said they saw him, and held to it at great cost.\nAsk what explanation fits those facts best.',
      sample:
        "You're right that dead people stay dead. That is why the first Christians treated this as God's act, not a normal event. The claim started early and in public, in the city where Jesus was killed. People do die for things that are false, but the disciples were in a position to know whether they had seen him. I'd ask what explains all that better.",
    },
    review: {
      couldAdd: 'Ask what kind of evidence would count for them.',
      possibleAnswer:
        'The resurrection is a claim about history, so it can be weighed like one. The early, public witness of people who said they saw him alive is the heart of the case.',
    },
  },

  'only-way': {
    draft: true,
    opening: 'Saying Jesus is the only way sounds arrogant. What about everyone else?',
    replies: [
      'So billions of sincere people are just wrong?',
      'What about someone who never even heard of him?',
      "It's awfully convenient that the true religion is the one you happen to hold.",
      "Why can't you just say it's true for you?",
    ],
    coach: {
      nudge: 'Notice the worry is about fairness and arrogance, not only about truth.',
      outline:
        'Agree it can be said arrogantly, and that would be wrong.\nThe claim comes from Jesus himself, not from Christians wanting to win.\nIt is an invitation open to anyone, not a prize for the right group.\nBe honest that you trust God to be fair with those who never heard.',
      sample:
        'It can sound arrogant, and sometimes Christians say it that way. I am sorry for that. But the claim is not mine. Jesus said it about himself, and I have to decide what to do with it. I also believe the invitation is open to everyone, and that God will be fair to people who never heard.',
    },
    review: {
      couldAdd: 'Say plainly that being right is not the same as being better than anyone.',
      possibleAnswer:
        'The claim that Jesus is the way comes from Jesus. Christians can hold it with humility, because it is about what he did, not about them being better people.',
    },
  },

  science: {
    draft: true,
    opening: "We have science now. We don't need God to explain things anymore.",
    replies: [
      "Every time we didn't understand something, people said God did it. Then science explained it.",
      "There's no evidence for God you could test in a lab.",
      "A lot of scientists don't believe, though. Doesn't that tell you something?",
      "So what does God explain that science can't?",
    ],
    coach: {
      nudge: 'Ask whether science and God are answering the same kind of question.',
      outline:
        "Be glad for science. Many of its founders believed in God.\nScience explains how things work. It does not tell us why there is anything at all.\nGod is not a filler for what we don't know yet.\nAsk which finding they think rules God out.",
      sample:
        "I'm grateful for science, and many of the people who built it believed in God. Science is very good at explaining how things work. It can't tell us why there is a universe to study, or why it follows laws we can understand. I don't see them as rivals. Is there a specific finding that you think rules God out?",
    },
    review: {
      couldAdd: 'Avoid using God to fill gaps in what we know. Point to why there is order at all.',
      possibleAnswer:
        'Science explains how the world works. It does not answer why there is a world, or why it is orderly enough to study. Those questions point past science.',
    },
  },

  evolution: {
    draft: true,
    opening: 'Evolution explains how we got here. Where exactly does God fit?',
    replies: [
      "Genesis says six days. Science says billions of years. Both can't be right.",
      "If it all runs on natural processes, God isn't doing anything.",
      'Evolution is full of death and waste. Is that how a good God works?',
      'So do you accept the science or not?',
    ],
    coach: {
      nudge:
        "Don't let it turn into a debate about the age of the earth. The real question is whether a process rules out a purpose.",
      outline:
        "Christians hold different views on how to read Genesis and on evolution.\nExplaining a process does not remove the one behind it.\nThe central claim is that God made everything, however he did it.\nBe honest about your own view and what you're unsure of.",
      sample:
        "Christians disagree with each other on this, and I want to be honest about that. Some read the days in Genesis as ordinary days and some don't. What all of us hold is that God is the one behind the universe, however it unfolded. Describing how something happened doesn't tell you there was no one behind it.",
    },
    review: {
      couldAdd: 'Name the range of Christian views instead of defending one as the only option.',
      possibleAnswer:
        'Explaining the process by which life developed does not answer whether there is a creator behind it. Christians differ on the details and agree that God made all things.',
    },
  },

  existence: {
    draft: true,
    opening: "You can't see God or measure him. How do you know he's there at all?",
    replies: [
      "A feeling in your heart isn't evidence.",
      'The universe could just exist. Why add a God to it?',
      'If God wanted us to know, he could make it obvious.',
      'What would it take for you to stop believing?',
    ],
    coach: {
      nudge: 'Ask what kind of evidence they would accept. That shapes everything after.',
      outline:
        'Agree that a feeling alone is not enough.\nThere is a universe, it is orderly, and it holds minds that can understand it.\nMost of all, Christians point to Jesus: a life in history that can be examined.\nSay briefly why you believe.',
      sample:
        "A feeling by itself wouldn't convince me either. For me it's a few things together. There is a universe when there could have been nothing. It runs on order we can understand. We have a sense of right and wrong that feels like more than taste. Most of all there is Jesus, a person in history whose life I can look at. None of that is a proof. Together it's why I believe.",
    },
    review: {
      couldAdd: 'Share your own reason for believing in a sentence. A personal answer is allowed.',
      possibleAnswer:
        'There is no single proof. The case builds: a universe that exists and is ordered, a moral sense, and above all the life of Jesus, which can be examined.',
    },
  },

  'who-made-god': {
    draft: true,
    opening: 'You say everything needs a cause. Fine. Then who made God?',
    replies: [
      'Saying he always existed is just a special exception for your side.',
      "Then why can't the universe be the thing that always existed?",
      "That's just words. You can define anything into existence.",
      "Doesn't it bother you that you can't actually prove any of this?",
    ],
    coach: {
      nudge: 'Check the starting claim. The argument is that whatever begins has a cause, not that everything does.',
      outline:
        'Correct the premise gently: things that begin need a cause.\nChristians have always said God had no beginning.\nSomething must exist without a cause, or nothing would exist now.\nThe question is what makes most sense as that something.',
      sample:
        "Good question, and an old one. I wouldn't say everything needs a cause. I'd say everything that begins does. Christians have always understood God as having no beginning. Something has to exist without being caused, or there would be nothing now. So the real question is whether that something is more like a mind or more like matter.",
    },
    review: {
      couldAdd: 'Restate their objection in its strongest form before you answer it.',
      possibleAnswer:
        'The claim is that whatever begins to exist has a cause. God, as Christians understand him, never began. Something must be uncaused, and the question is what.',
    },
  },

  'good-without-god': {
    draft: true,
    opening: 'I know plenty of atheists who are kinder than Christians. Why would anyone need God to be good?',
    replies: [
      "So you're saying people who don't believe can't be moral?",
      'We evolved to cooperate. That explains morality fine.',
      "Religious people have done terrible things in God's name.",
      'Then what does God add, in practice?',
    ],
    coach: {
      nudge: 'Agree first. The question is not whether unbelievers can be good, but where good comes from.',
      outline:
        "Say yes: people who don't believe can be kind and honest.\nThe question is why anything is truly right or wrong, not only preferred.\nChristians believe a moral sense is built into everyone.\nAdmit that Christians often fail the standard they hold.",
      sample:
        "Yes, you can, and I know people like that too. I'm not saying unbelievers can't be good. My question is a step back from that. If there is no God, what makes kindness right and cruelty wrong, and not only things we happen to like or dislike? I think the moral sense you have is real, and that it points to something.",
    },
    review: {
      couldAdd: 'Agree out loud that unbelievers can be good. It lowers the temperature.',
      possibleAnswer:
        'People can be good without believing in God. The harder question is what makes anything good at all. Christians believe that moral sense comes from the God who made us.',
    },
  },

  hell: {
    draft: true,
    opening: "A loving God who sends people to hell forever? That doesn't add up.",
    replies: [
      "Eternal punishment for a few decades of mistakes isn't justice.",
      'So my grandmother, who never went to church, is in hell?',
      'It sounds like a threat to keep people in line.',
      "If God wants everyone saved, why doesn't he just do it?",
    ],
    coach: {
      nudge: 'Listen for who they are thinking of. This question is often about a person.',
      outline:
        "Agree it is a hard teaching and that you feel the weight of it.\nYou are not anyone's judge. God is, and he is just and merciful.\nThe Bible says God does not want anyone to perish.\nLove does not force. God honors a person's choice to turn away.",
      sample:
        "This is one of the hardest things Christians believe, and I feel the weight of it. I'm not the judge of your grandmother or anyone else. I trust that God is both just and merciful, more than I am. The Bible says he does not want anyone to perish. I also think love cannot be forced, so God takes seriously a person's choice about him.",
    },
    review: {
      couldAdd: 'Refuse to speculate about any one person. Say that judgment belongs to God.',
      possibleAnswer:
        'Hell is a hard teaching. Christians hold that God is perfectly just and does not want anyone to perish, and that he does not force anyone to be with him.',
    },
  },

  'all-religions': {
    draft: true,
    opening: 'All religions basically say the same thing. Be kind, love people. Why insist on one?',
    replies: [
      "They're different paths up the same mountain.",
      "Arguing about who's right is exactly what causes conflict.",
      "You'd be a Hindu if you'd been born in India.",
      "Isn't it more humble to say nobody knows?",
    ],
    coach: {
      nudge:
        'Honor the instinct toward peace, then ask whether the religions themselves would agree they are the same.',
      outline:
        'Agree that many religions share moral teaching.\nThey differ on the big questions: who God is, what is wrong with us, what puts it right.\nTaking each faith seriously means letting it say what it actually says.\nDisagreeing is not the same as disrespecting.',
      sample:
        "There's something good in that instinct. Many faiths do share moral teaching. But they say very different things about who God is and what our deepest problem is. I think respecting a religion means letting it speak for itself, and most of them would not say they're all the same. We can disagree and still treat each other well.",
    },
    review: {
      couldAdd: 'Show that you know and respect what another faith actually teaches.',
      possibleAnswer:
        'Religions share a good deal of moral teaching and differ deeply on who God is and how we are made right with him. Respect means taking those differences seriously.',
    },
  },

  raised: {
    draft: true,
    opening:
      "You only believe this because your parents did. If you'd grown up somewhere else you'd believe something else.",
    replies: [
      "So you admit it's mostly an accident of birth.",
      "Have you ever seriously considered that you're wrong?",
      "Faith means believing without evidence. That's the problem.",
      'What made you keep it once you were old enough to choose?',
    ],
    coach: {
      nudge:
        "Concede what's true. Upbringing shapes where you start. Where a belief came from doesn't settle whether it's true.",
      outline:
        'Agree that upbringing shapes where everyone starts, skeptics included.\nHow you came to a belief and whether it is true are separate questions.\nFaith in the Bible is trust that rests on reasons, not belief without them.\nShare when your faith became your own.',
      sample:
        "You're partly right. Where I grew up shaped where I started, and that's true for everyone, including people raised without faith. But where a belief comes from doesn't tell you whether it's true. At some point each of us has to test it for ourselves, and I have.",
    },
    review: {
      couldAdd: 'Tell the moment your faith became your own, in a sentence or two.',
      possibleAnswer:
        'Upbringing shapes where everyone begins. It does not decide what is true. Christian faith is meant to be tested and held for reasons.',
    },
  },

  hypocrites: {
    draft: true,
    opening: 'Christians talk about love and then act worse than everyone else. Why would I want any part of that?',
    replies: [
      "It's not one or two people. Look at the scandals.",
      "If it really changed people, wouldn't you be able to tell?",
      "Someone at a church hurt me. That's what I think of when I hear the word.",
      'So why do you stay?',
    ],
    coach: {
      nudge: "Don't defend the church first. Agree with what's true and listen for a wound.",
      outline:
        "Agree, without excuses. Jesus was hard on religious hypocrisy too.\nIf they were hurt, say you're sorry before anything else.\nThe church is for people who know they need help, not people who have arrived.\nPoint to Jesus, not to Christians, as the one to judge the faith by.",
      sample:
        "You're right, and I won't defend it. Jesus saved his hardest words for religious people who said one thing and did another. I'm sorry for what happened to you. The church is meant to be for people who know they need help, and we often forget that. I'd ask you to judge Christianity by Jesus, not by us.",
    },
    review: {
      couldAdd: 'Apologize without adding "but". Let the apology stand.',
      possibleAnswer:
        'The charge is often true, and Jesus made it himself. Christian faith rests on who Jesus is, not on Christians being better than others.',
    },
  },

  wars: {
    draft: true,
    opening: 'Religion has caused more wars than anything else. The world would be better off without it.',
    replies: [
      'The Crusades. The Inquisition. Need I go on?',
      'Believing you have God on your side makes people dangerous.',
      "You can't just say those weren't real Christians.",
      'What good has it actually done, then?',
    ],
    coach: {
      nudge: 'Own the real failures first. Then ask whether the history is as simple as the claim.',
      outline:
        "Admit the wrongs done in Christ's name. Don't explain them away.\nThose acts went against what Jesus taught: love your enemies.\nPeople fight over land, power and ideas too, with or without religion.\nPoint to the good done in his name as well, like care for the sick and the poor.",
      sample:
        "Terrible things have been done in the name of Christ, and I won't excuse them. They were done against what Jesus taught. He told his followers to love their enemies. I also don't think religion is the only cause. People have fought over land, power and ideas of every kind. I'd judge the faith by Jesus and by people who followed him closely.",
    },
    review: {
      couldAdd: 'Name a specific wrong and own it before you make any other point.',
      possibleAnswer:
        "Christians have done real evil in Christ's name, against his own teaching. Violence has many causes. The fair measure of the faith is Jesus and what he taught.",
    },
  },
};

export function isDraft(questionId: string): boolean {
  return SCRIPTS[questionId]?.draft ?? true;
}
