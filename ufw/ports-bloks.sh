sudo ufw status verbose
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5555/tcp
sudo ufw allow from 127.0.0.1 to any port 3000
sudo ufw allow from 127.0.0.1 to any port 8080
sudo ufw deny 3000/tcp
sudo ufw deny 8080/tcp
sudo ufw enable
sudo ufw status numbered
sudo ufw reload

# Rollback changes:
# sudo ufw status numbered
# sudo ufw delete <rule_number>
# Or reset all rules and disable:
# sudo ufw reset
# sudo ufw disable