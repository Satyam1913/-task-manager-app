# Deployment Guide — AWS EC2 (backend + MySQL) + AWS S3 (frontend)

This mirrors a real deployment: the Spring Boot API and MySQL run together on
one EC2 instance, and the static frontend is hosted separately on S3.

## Part 1 — Launch the EC2 instance

1. In the AWS Console, launch an **EC2** instance:
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: `t2.micro` (Free Tier eligible)
   - Key pair: create or reuse one for SSH access
2. Configure the **Security Group** to allow inbound:
   - `22` (SSH) — your IP only
   - `8080` (Spring Boot API) — your IP, or `0.0.0.0/0` for public access
   - `3306` (MySQL) — only if you need remote DB access; otherwise keep it internal
3. Launch the instance and note its **public IP**.

## Part 2 — Install dependencies on EC2

SSH in, then install Java and MySQL:

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt update
sudo apt install -y openjdk-17-jdk mysql-server git maven
```

## Part 3 — Configure MySQL

```bash
sudo mysql
```

```sql
CREATE DATABASE taskmanager;
CREATE USER 'taskapp'@'localhost' IDENTIFIED BY 'a_strong_password';
GRANT ALL PRIVILEGES ON taskmanager.* TO 'taskapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Part 4 — Deploy the backend

Clone the repo directly onto the instance so future updates are a simple `git pull`:

```bash
git clone <your-repo-url>
cd task-manager-app/backend
```

Set the environment variables (add these to `~/.bashrc` or a `.env` loader so
they persist across reboots):

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=taskmanager
export DB_USERNAME=taskapp
export DB_PASSWORD=a_strong_password
export SERVER_PORT=8080
```

Build the JAR:

```bash
mvn clean package -DskipTests
```

Run it as a background process for a quick test:

```bash
nohup java -jar target/task-manager.jar > app.log 2>&1 &
```

Verify it's live:

```bash
curl http://localhost:8080/api/tasks
```

### Keep it running with systemd (recommended)

Create `/etc/systemd/system/taskmanager.service`:

```ini
[Unit]
Description=Task Manager Spring Boot App
After=network.target mysql.service

[Service]
User=ubuntu
EnvironmentFile=/home/ubuntu/task-manager-app/backend/.env
ExecStart=/usr/bin/java -jar /home/ubuntu/task-manager-app/backend/target/task-manager.jar
SuccessExitStatus=143
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable taskmanager
sudo systemctl start taskmanager
```

This is what makes the app survive reboots and crashes without manual intervention.

## Part 5 — Host the frontend on S3

1. Create an S3 bucket (e.g. `task-manager-frontend-<yourname>`).
2. Enable **Static website hosting** in the bucket's Properties tab, with
   `index.html` as the index document.
3. Before uploading, update `frontend/script.js`:

   ```javascript
   const API_BASE = "http://<EC2_PUBLIC_IP>:8080/api/tasks";
   ```

4. Upload `index.html`, `style.css`, and `script.js` to the bucket.
5. Set a bucket policy to allow public reads of these objects.
6. Your frontend is now live at the S3 static website endpoint shown in the
   bucket's Properties tab.

## Redeploying changes (change management)

For any future code change, the workflow is:

```bash
git add .
git commit -m "Describe the change"
git push

# on the EC2 instance
git pull
mvn clean package -DskipTests
sudo systemctl restart taskmanager
```

Keeping the deployment steps in this file (rather than only in memory) is what
makes the process reproducible for the next change or the next person picking
up the project.
