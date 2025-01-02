class VisualEffects {
    static createClickParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'click-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        document.body.appendChild(particle);

        // Remove particle after animation
        particle.addEventListener('animationend', () => particle.remove());
    }

    static showAchievementPopup(achievement) {
        const popup = document.getElementById('achievementPopup');
        const title = popup.querySelector('.achievement-title');
        const description = popup.querySelector('.achievement-description');

        title.textContent = achievement.name;
        description.textContent = achievement.description;

        popup.classList.add('show');
        popup.addEventListener('animationend', () => {
            popup.classList.remove('show');
        }, { once: true });
    }

    static createDataParticle(element, amount) {
        const particle = document.createElement('div');
        particle.className = 'data-particle';
        particle.textContent = `+${amount} GB`;

        // Random position within the element
        const rect = element.getBoundingClientRect();
        const x = Math.random() * (rect.width - 20);
        const y = rect.height / 2;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        element.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove());
    }

    static addClickListeners() {
        // Add click particle effect to action button
        document.getElementById('fixComputer').addEventListener('click', (e) => {
            this.createClickParticle(e.clientX, e.clientY);
        });

        // Add click effects to all progress bars
        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.addEventListener('click', (e) => {
                this.createClickParticle(e.clientX, e.clientY);
            });
        });
    }

    static showClickEffect(value) {
        // Create floating number effect
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${value}`;
        
        // Position near the cursor
        const button = document.getElementById('fixComputer');
        const rect = button.getBoundingClientRect();
        
        effect.style.left = `${rect.left + rect.width/2}px`;
        effect.style.top = `${rect.top}px`;
        
        document.body.appendChild(effect);
        
        // Remove after animation
        setTimeout(() => effect.remove(), 1000);
    }
}

// Achievement system
class AchievementSystem {
    static achievements = {
        production: [
            {
                id: 'data100',
                name: 'Digital Beginner',
                description: 'Generate 100 GB of data',
                requirement: 100,
                icon: 'database',
                reward: 'Click value +1'
            },
            {
                id: 'data1000',
                name: 'Data Enthusiast',
                description: 'Generate 1,000 GB of data',
                requirement: 1000,
                icon: 'server',
                reward: 'All income +5%'
            },
            {
                id: 'data10000',
                name: 'Data Center Manager',
                description: 'Generate 10,000 GB of data',
                requirement: 10000,
                icon: 'network-wired',
                reward: 'All income +10%'
            },
            {
                id: 'data100000',
                name: 'Cloud Computing Pioneer',
                description: 'Generate 100,000 GB of data',
                requirement: 100000,
                icon: 'cloud',
                reward: 'Unlock special upgrade'
            }
        ],
        employees: [
            {
                id: 'hire1',
                name: 'First Hire',
                description: 'Hire your first employee',
                icon: 'user-tie',
                reward: 'Task speed +5%'
            },
            {
                id: 'hire5',
                name: 'Small Team',
                description: 'Have 5 employees working for you',
                requirement: 5,
                icon: 'users',
                reward: 'All income +10%'
            },
            {
                id: 'hire10',
                name: 'Growing Company',
                description: 'Have 10 employees working for you',
                requirement: 10,
                icon: 'building',
                reward: 'Task speed +10%'
            },
            {
                id: 'allTechs',
                name: 'Technical Excellence',
                description: 'Hire all types of technicians',
                icon: 'tools',
                reward: 'Technician income +25%'
            },
            {
                id: 'allEngineers',
                name: 'Engineering Master',
                description: 'Hire all types of system engineers',
                icon: 'microchip',
                reward: 'Engineer income +25%'
            }
        ],
        upgrades: [
            {
                id: 'upgrade5',
                name: 'Upgrade Master',
                description: 'Purchase 5 upgrades',
                requirement: 5,
                icon: 'arrow-up',
                reward: 'All upgrades 5% cheaper'
            },
            {
                id: 'upgrade10',
                name: 'Innovation Leader',
                description: 'Purchase 10 upgrades',
                requirement: 10,
                icon: 'lightbulb',
                reward: 'All upgrades 10% cheaper'
            },
            {
                id: 'maxSpeed',
                name: 'Speed Demon',
                description: 'Max out the Faster Computers upgrade',
                icon: 'tachometer-alt',
                reward: 'Task speed +25%'
            }
        ],
        milestones: [
            {
                id: 'firstMillion',
                name: 'First Million',
                description: 'Generate 1,000,000 GB of data',
                requirement: 1000000,
                icon: 'trophy',
                reward: 'Unlock prestige feature'
            },
            {
                id: 'fullAutomation',
                name: 'Full Automation',
                description: 'Have all employees automated',
                icon: 'robot',
                reward: 'All income +50%'
            },
            {
                id: 'techGiant',
                name: 'Tech Giant',
                description: 'Own every type of employee',
                icon: 'crown',
                reward: 'Unlock special features'
            }
        ],
        speed: [
            {
                id: 'speed100',
                name: 'Data Stream',
                description: 'Reach 100 GB/s',
                requirement: 100,
                icon: 'tachometer-alt',
                reward: 'Click value +5'
            },
            {
                id: 'speed1000',
                name: 'Data Tsunami',
                description: 'Reach 1,000 GB/s',
                requirement: 1000,
                icon: 'wind',
                reward: 'All income +20%'
            }
        ],
        workforce: {
            technicians: [
                {
                    id: 'tech_tier1',
                    name: 'Entry Level Support',
                    description: 'Hire your first Technician',
                    icon: 'user-tie',
                    reward: 'Task speed +5%'
                },
                {
                    id: 'tech_all',
                    name: 'Technical Department',
                    description: 'Hire all three Technicians',
                    icon: 'users-cog',
                    reward: 'All Technicians speed +10%'
                },
                {
                    id: 'tech_automated',
                    name: 'Automated Support',
                    description: 'Automate all Technicians',
                    icon: 'robot',
                    reward: 'Technician income +25%'
                }
            ],
            engineers: [
                {
                    id: 'eng_tier1',
                    name: 'Systems Expert',
                    description: 'Hire your first System Engineer',
                    icon: 'server',
                    reward: 'All income +5%'
                },
                {
                    id: 'eng_all',
                    name: 'Engineering Division',
                    description: 'Hire all System Engineers',
                    icon: 'network-wired',
                    reward: 'All Engineers speed +15%'
                },
                {
                    id: 'eng_automated',
                    name: 'Automated Infrastructure',
                    description: 'Automate all System Engineers',
                    icon: 'cogs',
                    reward: 'Engineer income +30%'
                }
            ],
            developers: [
                {
                    id: 'dev_tier1',
                    name: 'Code Master',
                    description: 'Hire your first Developer',
                    icon: 'code',
                    reward: 'All income +10%'
                },
                {
                    id: 'dev_all',
                    name: 'Development Team',
                    description: 'Hire all Developers',
                    icon: 'laptop-code',
                    reward: 'All Developers speed +20%'
                },
                {
                    id: 'dev_automated',
                    name: 'CI/CD Pipeline',
                    description: 'Automate all Developers',
                    icon: 'code-branch',
                    reward: 'Developer income +40%'
                }
            ],
            milestones: [
                {
                    id: 'workforce_5',
                    name: 'Small Business',
                    description: 'Have 5 total employees',
                    icon: 'building',
                    reward: 'All income +15%'
                },
                {
                    id: 'workforce_10',
                    name: 'Growing Enterprise',
                    description: 'Have 10 total employees',
                    icon: 'city',
                    reward: 'All speed +10%'
                },
                {
                    id: 'full_automation',
                    name: 'Digital Transformation',
                    description: 'Automate every employee',
                    icon: 'microchip',
                    reward: 'All income +50%'
                }
            ]
        }
    };

    static init() {
        // Count total achievements
        const totalAchievements = this.countTotalAchievements();
        document.getElementById('totalAchievements').textContent = totalAchievements;
        document.getElementById('achievementCount').textContent = '0';
        
        // Initialize completion bar
        const completionFill = document.querySelector('.completion-fill');
        if (completionFill) {
            completionFill.style.width = '0%';
        }
        document.querySelector('.completion-text').textContent = '0% Complete';

        // Set initial category counts
        this.updateCategoryProgress('production', 0);
        this.updateCategoryProgress('workforce', 0);
        
        // Populate achievement cards
        this.populateAchievements();
    }

    static countTotalAchievements() {
        let total = 0;
        
        // Count production achievements
        total += this.achievements.production.length;
        
        // Count workforce achievements
        const workforce = this.achievements.workforce;
        total += workforce.technicians.length;
        total += workforce.engineers.length;
        total += workforce.developers.length;
        total += workforce.milestones.length;
        
        return total;
    }

    static updateCategoryProgress(category, completed) {
        const progressElement = document.querySelector(`#${category}Achievements .category-progress`);
        if (progressElement) {
            const total = category === 'production' ? 
                this.achievements.production.length :
                this.achievements.workforce.technicians.length +
                this.achievements.workforce.engineers.length +
                this.achievements.workforce.developers.length +
                this.achievements.workforce.milestones.length;
                
            progressElement.textContent = `${completed}/${total}`;
        }
    }

    static populateAchievements() {
        // Populate technician achievements
        const techContainer = document.getElementById('techAchievements');

        if (techContainer) {
            this.achievements.workforce.technicians.forEach(achievement => {
                const card = this.createAchievementCard(achievement);
                techContainer.appendChild(card);
            });
        }

        // Populate workforce achievements by subcategory
        const { technicians, engineers, developers, milestones } = this.achievements.workforce;
        
        // Engineers
        const engContainer = document.getElementById('engAchievements');
        if (engContainer) {
            engineers.forEach(achievement => {
                engContainer.appendChild(this.createAchievementCard(achievement));
            });
        }

        // Developers
        const devContainer = document.getElementById('devAchievements');
        if (devContainer) {
            developers.forEach(achievement => {
                devContainer.appendChild(this.createAchievementCard(achievement));
            });
        }

        // Workforce Milestones
        const milestonesContainer = document.getElementById('workforceMilestones');
        if (milestonesContainer) {
            milestones.forEach(achievement => {
                milestonesContainer.appendChild(this.createAchievementCard(achievement));
            });
        }

        // Populate upgrade achievements
        const upgradeContainer = document.querySelector('#upgradeAchievements .achievement-list');
        if (upgradeContainer) {
            this.achievements.upgrades.forEach(achievement => {
                upgradeContainer.appendChild(this.createAchievementCard(achievement));
            });
        }
    }

    static createAchievementCard(achievement) {
        const card = document.createElement('div');
        card.className = 'achievement-card locked';
        card.id = `achievement-${achievement.id}`;
        
        let progressHtml = '';
        if (achievement.requirement) {
            progressHtml = `<div class="achievement-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">0/${achievement.requirement}</span>
            </div>`;
        }
        
        card.innerHTML = `
            <div class="achievement-icon">
                <i class="fas fa-${achievement.icon}"></i>
            </div>
            <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                ${progressHtml}
                <span class="achievement-reward">${achievement.reward}</span>
            </div>
        `;
        
        return card;
    }

    static checkAchievements() {
        // This will be called periodically to check for new achievements
        // Implementation depends on your game's state management
    }

    static unlockAchievement(achievementId) {
        console.log('Attempting to unlock:', achievementId); // Debug log
        
        const achievement = this.findAchievement(achievementId);
        console.log('Found achievement:', achievement); // Debug log
        
        if (!achievement) {
            console.error('Achievement not found:', achievementId);
            return;
        }

        const card = document.getElementById(`achievement-${achievementId}`);
        console.log('Found card:', card); // Debug log
        console.log('Card classes:', card?.classList.toString()); // Debug log
        
        if (card && card.classList.contains('locked')) {
            console.log('Unlocking achievement:', achievement.name); // Debug log
            card.classList.remove('locked');
            this.showAchievementNotification(achievement);
            this.grantAchievementReward(achievement);
            
            // Update counts and progress
            this.updateAchievementCounts();
        } else {
            console.log('Card not found or not locked'); // Debug log
        }
    }

    static findAchievement(achievementId) {
        // Check production achievements
        const productionAchievement = this.achievements.production.find(a => a.id === achievementId);
        if (productionAchievement) return productionAchievement;

        // Check upgrade achievements
        const upgradeAchievement = this.achievements.upgrades.find(a => a.id === achievementId);
        if (upgradeAchievement) return upgradeAchievement;

        // Check speed achievements
        const speedAchievement = this.achievements.speed.find(a => a.id === achievementId);
        if (speedAchievement) return speedAchievement;

        // Check workforce achievements
        const workforce = this.achievements.workforce;
        
        // Check each workforce subcategory
        for (const category of ['technicians', 'engineers', 'developers', 'milestones']) {
            const achievement = workforce[category].find(a => a.id === achievementId);
            if (achievement) return achievement;
        }

        return null;
    }

    static grantAchievementReward(achievement) {
        console.log('Granting achievement reward:', achievement.reward);
        
        // Apply the reward
        game.applyAchievementReward(achievement.reward);
        
        // Show notification
        this.showAchievementNotification(achievement);
    }

    static showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        notification.innerHTML = `
            <div class="achievement-icon">
                <i class="fas fa-${achievement.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="achievement-header">
                    <h4>${achievement.name}</h4>
                    <span class="achievement-tag">Achievement Unlocked!</span>
                </div>
                <p class="achievement-reward">${achievement.reward}</p>
            </div>
        `;

        document.body.appendChild(notification);
        
        // Optional: Add achievement sound
        const sound = new Audio('achievement.mp3');
        sound.volume = 0.3;
        sound.play().catch(() => {});
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    static checkProductionAchievements(totalData) {
        const productionAchievements = this.achievements.production;
        productionAchievements.forEach(achievement => {
            if (totalData >= achievement.requirement) {
                this.unlockAchievement(achievement.id);
            }
        });
    }

    static checkSpeedAchievements(dataPerSecond) {
        const speedAchievements = this.achievements.speed;
        speedAchievements.forEach(achievement => {
            if (dataPerSecond >= achievement.requirement) {
                this.unlockAchievement(achievement.id);
            }
        });
    }

    static checkWorkforceAchievements(game) {
        // Check technician achievements
        const techCount = game.countOwnedEmployees('technician');
        const techsAutomated = game.areAllEmployeesAutomated('technician');
        
        if (techCount >= 1) {
            this.unlockAchievement('tech_tier1');
        }
        if (techCount >= 3) {
            this.unlockAchievement('tech_all');
        }
        if (techsAutomated) {
            this.unlockAchievement('tech_automated');
        }
        
        // Check engineer achievements
        const engCount = game.countOwnedEmployees('syseng');
        const engsAutomated = game.areAllEmployeesAutomated('syseng');
        
        if (engCount >= 1) this.unlockAchievement('eng_tier1');
        if (engCount >= 3) this.unlockAchievement('eng_all');
        if (engsAutomated) this.unlockAchievement('eng_automated');
        
        // Check developer achievements
        const devCount = game.countOwnedEmployees('developer');
        const devsAutomated = game.areAllEmployeesAutomated('developer');
        
        if (devCount >= 1) this.unlockAchievement('dev_tier1');
        if (devCount >= 3) this.unlockAchievement('dev_all');
        if (devsAutomated) this.unlockAchievement('dev_automated');
        
        // Check total workforce achievements
        const totalEmployees = techCount + engCount + devCount;
        if (totalEmployees >= 5) this.unlockAchievement('workforce_5');
        if (totalEmployees >= 10) this.unlockAchievement('workforce_10');
        
        // Check full automation
        if (techsAutomated && engsAutomated && devsAutomated) {
            this.unlockAchievement('full_automation');
        }
    }

    static updateAchievementProgress(achievementId, currentValue) {
        const card = document.getElementById(`achievement-${achievementId}`);
        if (!card) return;

        const achievement = this.findAchievement(achievementId);
        if (!achievement || !achievement.requirement) return;

        const progress = Math.min((currentValue / achievement.requirement) * 100, 100);
        const progressFill = card.querySelector('.progress-fill');
        const progressText = card.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${currentValue}/${achievement.requirement}`;
        }

        // Add near-complete class when close to achieving
        if (progress >= 80 && progress < 100) {
            card.classList.add('near-complete');
        } else {
            card.classList.remove('near-complete');
        }
    }

    // Also add a method to check achievement progress
    static checkAllAchievements(game) {
        // Check production achievements
        this.checkProductionAchievements(game.statistics.totalDataGenerated);
        
        // Check speed achievements
        this.checkSpeedAchievements(game.calculateDataPerSecond());
        
        // Check workforce achievements
        this.checkWorkforceAchievements(game);
        
        // Update progress for all achievements
        this.updateAllProgress(game);
    }

    // Add method to update all achievement progress
    static updateAllProgress(game) {
        // Update production achievement progress
        this.achievements.production.forEach(achievement => {
            if (achievement.requirement) {
                this.updateAchievementProgress(
                    achievement.id, 
                    game.statistics.totalDataGenerated
                );
            }
        });

        // Update speed achievement progress
        this.achievements.speed.forEach(achievement => {
            if (achievement.requirement) {
                this.updateAchievementProgress(
                    achievement.id, 
                    game.calculateDataPerSecond()
                );
            }
        });

        // Update workforce achievement progress
        const workforce = this.achievements.workforce;
        const totalEmployees = game.countTotalEmployees();

        workforce.milestones.forEach(achievement => {
            if (achievement.requirement) {
                this.updateAchievementProgress(
                    achievement.id,
                    totalEmployees
                );
            }
        });

        // Update other category-specific progress
        const techCount = game.countOwnedEmployees('technician');
        const engCount = game.countOwnedEmployees('syseng');
        const devCount = game.countOwnedEmployees('developer');

        workforce.technicians.forEach(achievement => {
            if (achievement.requirement) {
                this.updateAchievementProgress(achievement.id, techCount);
            }
        });

        workforce.engineers.forEach(achievement => {
            if (achievement.requirement) {
                this.updateAchievementProgress(achievement.id, engCount);
            }
        });

        workforce.developers.forEach(achievement => {
            if (achievement.requirement) {
                this.updateAchievementProgress(achievement.id, devCount);
            }
        });
    }

    // Add helper method to count completed achievements
    static getCompletedCount(category) {
        const selector = `#${category}Achievements .achievement-card:not(.locked)`;
        return document.querySelectorAll(selector).length;
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    VisualEffects.addClickListeners();
    AchievementSystem.init();
}); 