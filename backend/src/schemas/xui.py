import json
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ValidationError, field_validator, model_validator

from src.core.enums import ConfigTypes


class XuiClientStats(BaseModel):
    id: int
    inboundId: int
    enable: bool
    email: str
    uuid: str
    subId: str
    up: int
    down: int
    allTime: int
    expiryTime: int
    total: int
    reset: int
    lastOnline: int


class XuiClient(BaseModel):
    comment: str
    created_at: int
    email: str
    enable: bool
    expiryTime: int
    flow: str | None = None  # Required for VLESS, optional for others
    id: str | None = None  # Required for VLESS, optional for others
    password: str | None = None  # Required for Trojan, optional for others
    limitIp: int
    reset: int
    subId: str | int | None
    tgId: str | int | None
    usedGB: float = 0
    totalGB: int
    updated_at: int


class XuiClientCreateBase(BaseModel):
    comment: str = 'created:manual'
    email: str
    enable: bool = True
    expiryTime: int = 0
    limitIp: int = 1
    reset: int = 0
    subId: str | int | None = None
    tgId: str | int | None = 0
    totalGB: int = 0


class XuiVlessClientCreate(XuiClientCreateBase):
    id: str
    flow: str = 'xtls-rprx-vision'
    email: str = f'{ConfigTypes.VLESS}_2a73d28a-7c09-4470-9637-9969dd5dc564'
    subId: str | int | None = '2a73d28a-7c09-4470-9637-9969dd5dc564'


class XuiTrojanClientCreate(XuiClientCreateBase):
    password: str
    email: str = f'{ConfigTypes.TROJAN}_2a73d28a-7c09-4470-9637-9969dd5dc564'
    subId: str | int | None = '2a73d28a-7c09-4470-9637-9969dd5dc564'


class XuiClientUpdate(BaseModel):
    enable: bool | None = None
    expiryTime: int | None = None
    limitIp: int | None = 1
    totalGB: int | None = None


class InboundSettings(BaseModel):
    clients: List[XuiClient]
    decryption: str | None = None
    encryption: str | None = None
    fallbacks: List[Any] | None = None


class RealitySettings(BaseModel):
    show: bool
    xver: int
    target: str
    serverNames: List[str]
    privateKey: str
    minXuiClientVer: str | None = None
    maxXuiClientVer: str | None = None
    maxTimediff: int
    shortIds: List[str]
    mldsa65Seed: str
    settings: Dict[str, Any]


class TcpSettings(BaseModel):
    acceptProxyProtocol: bool
    header: Dict[str, str]


class StreamSettings(BaseModel):
    network: str
    security: str
    externalProxy: List[Any]
    realitySettings: RealitySettings | None = None  # Required for Reality, optional for others
    tcpSettings: TcpSettings


class Sniffing(BaseModel):
    enabled: bool
    destOverride: List[str]
    metadataOnly: bool
    routeOnly: bool


class Inbound(BaseModel):
    id: int
    up: int
    down: int
    total: int
    allTime: int
    remark: str
    enable: bool
    expiryTime: int
    trafficReset: str
    lastTrafficResetTime: int
    clientStats: List[XuiClientStats] | None = None
    listen: str
    port: int
    protocol: str
    settings: str  # JSON string
    streamSettings: str  # JSON string
    tag: str
    sniffing: str  # JSON string


class InboundResponse(BaseModel):
    id: int
    up: int
    down: int
    total: int
    allTime: int
    remark: str
    enable: bool
    expiryTime: int
    trafficReset: str
    lastTrafficResetTime: int
    clientStats: List[XuiClientStats] | None = None
    listen: str
    port: int
    protocol: str
    settings: InboundSettings
    streamSettings: StreamSettings
    tag: str
    sniffing: Sniffing

    @field_validator('clientStats', mode='before')
    @classmethod
    def parse_client_stats(cls, v: Any) -> List[XuiClientStats]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return [XuiClientStats(**stat) for stat in parsed]
            except (json.JSONDecodeError, ValidationError) as e:
                raise ValueError(f'Invalid client stats JSON: {e}')
        return v  # type: ignore

    @field_validator('settings', mode='before')
    @classmethod
    def parse_settings(cls, v: Any) -> InboundSettings:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return InboundSettings(**parsed)
            except (json.JSONDecodeError, ValidationError) as e:
                raise ValueError(f'Invalid settings JSON: {e}')
        return v  # type: ignore

    @field_validator('streamSettings', mode='before')
    @classmethod
    def parse_stream_settings(cls, v: Any) -> StreamSettings:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                # For Reality security, realitySettings is required
                if parsed.get('security') == 'reality' and 'realitySettings' not in parsed:
                    raise ValueError('realitySettings is required for Reality security')
                return StreamSettings(**parsed)
            except (json.JSONDecodeError, ValidationError) as e:
                raise ValueError(f'Invalid streamSettings JSON: {e}')
        return v  # type: ignore

    @field_validator('sniffing', mode='before')
    @classmethod
    def parse_sniffing(cls, v: Any) -> Sniffing:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return Sniffing(**parsed)
            except (json.JSONDecodeError, ValidationError) as e:
                raise ValueError(f'Invalid sniffing JSON: {e}')
        return v  # type: ignore

    @model_validator(mode='after')
    def validate_protocol_specific_fields(self) -> 'InboundResponse':
        """Validate protocol-specific required fields"""
        if self.protocol == 'vless':
            if self.settings:
                if not self.settings.decryption:
                    self.settings.decryption = 'none'
                if not self.settings.encryption:
                    self.settings.encryption = 'none'
        elif self.protocol == 'trojan':
            if self.settings and not self.settings.fallbacks:
                self.settings.fallbacks = []

        if self.streamSettings and self.streamSettings.security == 'reality':
            if not self.streamSettings.realitySettings:
                raise ValueError('realitySettings is required for Reality security')

        return self

    @classmethod
    def from_inbound(cls, inbound: 'Inbound') -> 'InboundResponse':
        return cls(
            id=inbound.id,
            up=inbound.up,
            down=inbound.down,
            total=inbound.total,
            allTime=inbound.allTime,
            remark=inbound.remark,
            enable=inbound.enable,
            expiryTime=inbound.expiryTime,
            trafficReset=inbound.trafficReset,
            lastTrafficResetTime=inbound.lastTrafficResetTime,
            clientStats=inbound.clientStats,
            listen=inbound.listen,
            port=inbound.port,
            protocol=inbound.protocol,
            settings=inbound.settings,  # Will be parsed by validator
            streamSettings=inbound.streamSettings,  # Will be parsed by validator
            tag=inbound.tag,
            sniffing=inbound.sniffing,  # Will be parsed by validator
        )


class InboundCreate(BaseModel):
    port: int
    protocol: str
    settings: str
    streamSettings: str
    tag: str
    sniffing: str
    remark: Optional[str] = ''
    enable: bool = True
    expiryTime: int = 0
    trafficReset: str = 'never'


class InboundUpdate(BaseModel):
    remark: Optional[str] = None
    enable: Optional[bool] = None
    expiryTime: Optional[int] = None
    trafficReset: Optional[str] = None
    settings: Optional[str] = None
    streamSettings: Optional[str] = None
    sniffing: Optional[str] = None


class XuiLoginResponse(BaseModel):
    success: bool
    now_timestamp: str
    session_expires_at: str
    new_session: bool
