pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "your-docker-registry"
        APP_NAME = "wild-rydes"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${APP_NAME}-frontend:${BUILD_NUMBER}"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${APP_NAME}-backend:${BUILD_NUMBER}"
        DEPLOY_SERVER = "your-ec2-public-ip"
        SONARQUBE_ENV = "SonarQubeServer" // Replace with your SonarQube server name in Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    // Make sure sonar-scanner is installed on Jenkins
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t ${FRONTEND_IMAGE} .'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t ${BACKEND_IMAGE} .'
                }
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([string(credentialsId: 'docker-hub-credentials', variable: 'DOCKER_HUB_CREDENTIALS')]) {
                    sh 'echo ${DOCKER_HUB_CREDENTIALS} | docker login -u username --password-stdin'
                    sh 'docker push ${FRONTEND_IMAGE}'
                    sh 'docker push ${BACKEND_IMAGE}'
                }
            }
        }

        stage('Update Compose File') {
            steps {
                sh "sed -i 's|build:|image: ${FRONTEND_IMAGE}|g; s|context: ./frontend|#context: ./frontend|g; s|dockerfile: Dockerfile|#dockerfile: Dockerfile|g' docker-compose.yml"
                sh "sed -i 's|build:|image: ${BACKEND_IMAGE}|g; s|context: ./backend|#context: ./backend|g; s|dockerfile: Dockerfile|#dockerfile: Dockerfile|g' docker-compose.yml"
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ssh-key', keyFileVariable: 'SSH_KEY')]) {
                    sh "scp -i ${SSH_KEY} -o StrictHostKeyChecking=no docker-compose.yml ec2-user@${DEPLOY_SERVER}:/home/ec2-user/"
                    sh "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ec2-user@${DEPLOY_SERVER} 'docker-compose down && docker-compose up -d'"
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}

