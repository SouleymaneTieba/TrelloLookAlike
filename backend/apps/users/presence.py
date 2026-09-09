from collections import defaultdict


_connected_users = defaultdict(int)


def mark_user_online(user_id):
    _connected_users[user_id] += 1


def mark_user_offline(user_id):
    if _connected_users[user_id] <= 1:
        _connected_users.pop(user_id, None)
        return

    _connected_users[user_id] -= 1


def is_user_online(user_id):
    return _connected_users.get(user_id, 0) > 0
