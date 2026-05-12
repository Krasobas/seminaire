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

        FRONTEND_URL             = "${SEMINAIRE_FRONTEND_URL}"
    }

    stages {
        stage('Build') {
            steps {
                dir('seminaire-orthodoxe') {
                    sh 'docker compose build --no-cache'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('seminaire-orthodoxe') {
                    sh 'docker compose up -d --remove-orphans --force-recreate'
                }
            }
        }

        stage('Healthcheck') {
            steps {
                sh '''
                    echo "Waiting for services to start..."
                    sleep 15

                    # Check Strapi
                    STRAPI_OK=false
                    for i in 1 2 3 4 5; do
                        if docker exec seminaire-strapi wget -qO- http://localhost:1337/_health > /dev/null 2>&1; then
                            echo "Strapi: OK (attempt $i)"
                            STRAPI_OK=true
                            break
                        fi
                        echo "Strapi: not ready (attempt $i), waiting..."
                        sleep 10
                    done

                    if [ "$STRAPI_OK" = false ]; then
                        echo "WARNING: Strapi healthcheck failed after 5 attempts"
                        echo "=== Strapi logs ==="
                        docker logs seminaire-strapi --tail 50 2>&1
                    fi

                    # Check Astro
                    if docker exec seminaire-astro wget -qO- http://localhost:4321 > /dev/null 2>&1; then
                        echo "Astro: OK"
                    else
                        echo "WARNING: Astro healthcheck failed"
                        echo "=== Astro logs ==="
                        docker logs seminaire-astro --tail 30 2>&1
                    fi

                    # Check nginx
                    if docker exec seminaire-nginx wget -qO- http://astro:4321 > /dev/null 2>&1; then
                        echo "nginx: OK"
                    else
                        echo "WARNING: nginx healthcheck failed"
                        echo "=== nginx logs ==="
                        docker logs seminaire-nginx --tail 30 2>&1
                    fi
                '''
            }
        }
    }

    post {
        failure {
            echo 'Deploy failed — check logs: docker compose logs'
            sh 'docker logs seminaire-strapi --tail 100 2>&1 || true'
            sh 'docker logs seminaire-astro --tail 50 2>&1 || true'
            sh 'docker logs seminaire-nginx --tail 50 2>&1 || true'
        }
        cleanup {
            sh 'docker image prune -f'
        }
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
