pipeline {
    agent any

    environment {
        // Strapi secrets — stored in Jenkins credentials (Secret text)
        STRAPI_APP_KEYS          = credentials('seminaire-strapi-app-keys')
        STRAPI_API_TOKEN_SALT    = credentials('seminaire-strapi-api-token-salt')
        STRAPI_ADMIN_JWT_SECRET  = credentials('seminaire-strapi-admin-jwt-secret')
        STRAPI_TRANSFER_TOKEN_SALT = credentials('seminaire-strapi-transfer-token-salt')
        STRAPI_JWT_SECRET        = credentials('seminaire-strapi-jwt-secret')

        // Strapi API read token — generated after first Strapi setup, then added to Jenkins
        STRAPI_API_TOKEN         = credentials('seminaire-strapi-api-token')

        // Public
        FRONTEND_URL             = 'https://seminaire-orthodoxe.fr'
    }

    stages {
        stage('Build') {
            steps {
                dir('seminaire-orthodoxe') {
                    sh 'docker compose build'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('seminaire-orthodoxe') {
                    sh 'docker compose up -d --remove-orphans'
                }
            }
        }

        stage('Healthcheck') {
            steps {
                sh '''
                    echo "Waiting for services..."
                    sleep 10

                    # Check Strapi
                    if ! docker exec seminaire-strapi wget -qO- http://localhost:1337/_health > /dev/null 2>&1; then
                        echo "WARNING: Strapi healthcheck failed"
                    else
                        echo "Strapi: OK"
                    fi

                    # Check Astro
                    if ! docker exec seminaire-astro wget -qO- http://localhost:4321 > /dev/null 2>&1; then
                        echo "WARNING: Astro healthcheck failed"
                    else
                        echo "Astro: OK"
                    fi

                    # Check nginx
                    if ! docker exec seminaire-nginx wget -qO- http://astro:4321 > /dev/null 2>&1; then
                        echo "WARNING: nginx healthcheck failed"
                    else
                        echo "nginx: OK"
                    fi
                '''
            }
        }
    }

    post {
        always {
            script {
                def status = currentBuild.currentResult
                def emoji = status == 'SUCCESS' ? '✅' : status == 'FAILURE' ? '❌' : '⚠️'
                def duration = currentBuild.durationString.replace(' and counting', '')
                def buildInfo = """
${emoji} *Seminaire* — #${currentBuild.number}
━━━━━━━━━━━━━━━━━━━━
📌 Status: *${status}*
🕐 Started: ${new Date(currentBuild.startTimeInMillis).format('dd.MM.yyyy HH:mm:ss')}
⏱ Duration: ${duration}
━━━━━━━━━━━━━━━━━━━━
🔗 [Open in Jenkins](${env.BUILD_URL})
                """.trim()
                telegramSend(message: buildInfo)
            }
        }
    }
}
