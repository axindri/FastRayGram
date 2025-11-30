def get_allowed_origins(domains: str) -> list[str]:
    allowed_origins = []
    for domain in domains.split(','):
        domain = domain.strip()
        if not domain:
            continue
        if not domain.startswith('http'):
            allowed_origins.append(f'http://{domain}')
            allowed_origins.append(f'https://{domain}')
        else:
            allowed_origins.append(domain)
    return allowed_origins
