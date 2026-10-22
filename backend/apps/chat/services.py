from .models import MessageReaction


REACTION_EMOJIS = tuple(
    emoji for emoji, _label in MessageReaction.EMOJI_CHOICES
)


def get_message_reactions(message, user):
    reactions = {
        emoji: {"emoji": emoji, "count": 0, "reacted_by_me": False}
        for emoji in REACTION_EMOJIS
    }

    for reaction in message.reactions.all():
        item = reactions[reaction.emoji]
        item["count"] += 1
        if reaction.user_id == user.id:
            item["reacted_by_me"] = True

    return [
        reaction
        for reaction in reactions.values()
        if reaction["count"] > 0
    ]


def toggle_message_reaction(message, user, emoji):
    if emoji not in REACTION_EMOJIS:
        raise ValueError("Cette réaction n'est pas autorisée.")

    reaction, created = MessageReaction.objects.get_or_create(
        message=message,
        user=user,
        emoji=emoji,
    )

    if not created:
        reaction.delete()

    getattr(message, "_prefetched_objects_cache", {}).pop("reactions", None)
    return get_message_reactions(message, user)
