from datetime import datetime


def get_bytes_from_gb(gb: int) -> int:
    return gb * pow(1024, 3)


def get_gb_from_bytes(bytes: int) -> float:
    return round(float(bytes / pow(1024, 3)), 2)


def get_posix_timestamp_ms(datetime: datetime) -> int:
    return int(datetime.timestamp() * 1000)


def get_datetime_from_posix_timestamp_ms(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp / 1000)
