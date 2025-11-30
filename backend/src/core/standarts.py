from datetime import datetime


def get_date(timestamp: datetime) -> str:
    return timestamp.strftime('%Y-%m-%d')


def get_time(timestamp: datetime) -> str:
    return timestamp.strftime('%H:%M:%S')


def make_datetime(timestamp: str) -> datetime:
    """
    timestamp: str = "2021-01-01 00:00:00"
    """
    return datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')


def make_date(date: str) -> datetime:
    """
    date: str = "2021-01-01"
    """
    return datetime.strptime(date, '%Y-%m-%d')


def make_time(time: str) -> datetime:
    """
    time: str = "00:00:00"
    """
    return datetime.strptime(time, '%H:%M:%S')


def get_datetime_str(timestamp: datetime) -> str:
    return timestamp.strftime('%Y-%m-%d %H:%M:%S')


def get_timestamp_int(timestamp: datetime) -> int:
    return int(timestamp.timestamp())
