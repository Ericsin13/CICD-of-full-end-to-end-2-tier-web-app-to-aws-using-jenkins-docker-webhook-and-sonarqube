pipeline {
    agent any
    
    environment {
        SONAR_TOKEN = credentials('sonar-token')
        DOCKER_CREDENTIALS = credentials('docker-credentials')
        AWS_CREDENTIALS = credentials('aws-credentials')
        PROJECT_KEY = "wildrydes-site"
        DOCKER_IMAGE = "wildrydes-site:${BUILD_NUMBER}"
        DOCKER_REPO = "your-docker-repo"
        EC2_INSTANCE = "your-ec2-instance-ip"
        EC2_USER = "ec2-user"
        EC2_KEY = credentials('ec2-ssh-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('SonarCloud Analysis') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=${PROJECT_KEY} \
                        -Dsonar.organization=your-sonarcloud-organization \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=https://sonarcloud.io \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                script {
                    sh "echo ${DOCKER_CREDENTIALS_PSW} | docker login -u ${DOCKER_CREDENTIALS_USR} --password-stdin"
                    sh "docker tag ${DOCKER_IMAGE} ${DOCKER_REPO}/${DOCKER_IMAGE}"
                    sh "docker push ${DOCKER_REPO}/${DOCKER_IMAGE}"
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    // Setup SSH connection to EC2
                    sshagent(credentials: ['ec2-ssh-key']) {
                        // Stop and remove any existing container
                        sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_INSTANCE} 'docker stop wildrydes-container || true'"
                        sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_INSTANCE} 'docker rm wildrydes-container || true'"
                        
                        // Login to Docker registry on EC2
                        sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_INSTANCE} 'echo ${DOCKER_CREDENTIALS_PSW} | docker login -u ${DOCKER_CREDENTIALS_USR} --password-stdin'"
                        
                        // Pull the new image
                        sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_INSTANCE} 'docker pull ${DOCKER_REPO}/${DOCKER_IMAGE}'"
                        
                        // Run the new container
                        sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_INSTANCE} 'docker run -d -p 80:80 --name wildrydes-container ${DOCKER_REPO}/${DOCKER_IMAGE}'"
                    }
                }
            }
        }
    }
    
    post {
        always {
            sh "docker logout"
        }
    }
}