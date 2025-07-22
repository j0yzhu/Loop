# export aws environment variables such as AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN

aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 704018447260.dkr.ecr.ap-southeast-2.amazonaws.com

docker build -t loop-repo .

docker tag loop-repo:latest 704018447260.dkr.ecr.ap-southeast-2.amazonaws.com/loop-repo:latest

docker push 704018447260.dkr.ecr.ap-southeast-2.amazonaws.com/loop-repo:latest