class Game {
    constructor() {
        // Initialize base game properties
        this.data = 0;
        this.clickValue = 1;
        this.lastUpdate = performance.now();
        this.isHoldingClick = false;
        this.clickInterval = null;
        
        // Initialize statistics
        this.statistics = {
            totalDataGenerated: 0,
            totalClicks: 0,
            peakDPS: 0,
            timeSpentPlaying: 0
        };

        // Initialize achievement bonuses
        this.achievementBonuses = {
            taskSpeed: 0,
            income: 0,
            clickValue: 0
        };

        // Initialize task-related properties
        this.taskTimers = {};
        this.hasStartedFirstTask = false;
        
        // Initialize roles with proper structure
        this.roles = {
            technician: {
                employees: {
                    tech1: { owned: false, automated: false, cost: 25, baseReward: 15, baseTaskTime: 8000 },
                    tech2: { owned: false, automated: false, cost: 250, baseReward: 75, baseTaskTime: 12000 },
                    tech3: { owned: false, automated: false, cost: 2500, baseReward: 375, baseTaskTime: 16000 }
                }
            },
            manager: {
                employees: {
                    techManager1: { owned: false, cost: 100, manages: 'technician' }
                }
            }
        };

        // Initialize tutorial state
        this.tutorialState = {
            completed: false,
            currentStep: 0,
            steps: [
                {
                    message: "Welcome! Click or hold the computer button to generate data.",
                    trigger: 'start'
                },
                {
                    message: "Keep generating data! You need 25 GB to hire your first Technician.",
                    trigger: 'firstClick'
                },
                {
                    message: "Great! You can now hire a Technician. Click the 'Hire' button to get your first employee.",
                    trigger: 'canHireTech',
                    requirement: 25
                },
                {
                    message: "Technician hired! Click their progress bar to start generating data automatically.",
                    trigger: 'techHired'
                },
                {
                    message: "Your Technician is working! Keep generating data to afford a Manager (100 GB) who can automate your Technician.",
                    trigger: 'taskStarted'
                },
                {
                    message: "You can now hire a Manager! They'll make your Technician work automatically.",
                    trigger: 'canHireManager',
                    requirement: 100
                },
                {
                    message: "Manager hired! Now work towards hiring a second Technician to unlock Upgrades.",
                    trigger: 'managerHired'
                },
                {
                    message: "Upgrades unlocked! These permanent improvements will help you generate more data.",
                    trigger: 'upgradesUnlocked'
                }
            ]
        };

        // Initialize settings
        this.settings = {
            notificationDuration: 3000,
            progressAnimation: 'smooth',
            theme: 'default',
            colorScheme: 'blue'
        };

        // Initialize panels
        this.currentPanel = 'employeesPanel';
        this.initializePanelStates();

        // Initialize game systems
        this.initialize();

        // Load tutorial state
        this.loadTutorialState();

        // Add save-related properties
        this.autoSaveInterval = null;
        this.lastSaveTime = Date.now();
        
        // Load save data after initialization
        this.loadGame();
        
        // Start auto-save
        this.startAutoSave();

        // Add page unload handler
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });

        this.hasShownTechTutorial = false;
    }

    initialize() {
        this.setupClickHandlers();
        this.setupPanelHandlers();
        this.setupHireHandlers();
        this.setupEmployeeHandlers();
        this.setupManagerHandlers();
        this.setupSettingsHandlers();
        this.updateDisplay();
        this.startGameLoop();
    }

    setupClickHandlers() {
        const fixButton = document.getElementById('fixComputer');
        if (!fixButton) {
            console.error('Fix button not found');
            return;
        }

        const startAutoClick = () => {
            // Clear any existing interval
            this.stopAutoClick();
            
            // Do initial click
            this.handleClick();
            
            // Start auto-clicking
            this.holdIntervalId = setInterval(() => {
                this.handleClick();
            }, 750);
        };

        const stopAutoClick = () => {
            if (this.holdIntervalId) {
                clearInterval(this.holdIntervalId);
                this.holdIntervalId = null;
            }
        };

        // Mouse events
        fixButton.onmousedown = () => startAutoClick();
        document.onmouseup = () => stopAutoClick();

        // Touch events
        fixButton.ontouchstart = (e) => {
            e.preventDefault();
            startAutoClick();
        };
        document.ontouchend = () => stopAutoClick();

        // Clean up on page visibility change
        document.onvisibilitychange = () => {
            if (document.hidden) {
                stopAutoClick();
            }
        };
    }

    handleClick() {
        const totalClickValue = Math.round(this.clickValue * (1 + this.achievementBonuses.clickValue));
        this.data += totalClickValue;
        this.statistics.totalClicks++;
        this.statistics.totalDataGenerated += totalClickValue;
        this.updateDisplay();
        
        // Check tutorial steps
        if (this.statistics.totalClicks === 1) {
            this.showNextTutorialStep('firstClick');
        }
        
        // Check if player can hire first tech
        if (this.data >= 25 && !this.hasShownTechTutorial) {
            this.hasShownTechTutorial = true;
            this.showNextTutorialStep('canHireTech');
        }
    }

    updateDisplay() {
        // Update data display
        document.getElementById('data').textContent = Math.floor(this.data);
        
        // Update DPS display
        document.getElementById('dataPerSecond').textContent = this.calculateDataPerSecond();
        
        // Update click value display
        const clickButton = document.getElementById('fixComputer');
        if (clickButton) {
            const clickSpan = clickButton.querySelector('span');
            if (clickSpan) {
                const totalClickValue = Math.round(this.clickValue * (1 + this.achievementBonuses.clickValue));
                clickSpan.textContent = `Fix Computer (+${totalClickValue} GB)`;
            }
        }

        // Check unlocks after display update
        this.checkUnlocks();
    }

    startGameLoop() {
        setInterval(() => {
            const now = performance.now();
            const deltaTime = now - this.lastUpdate;
            this.lastUpdate = now;
            
            // Update game state
            this.update(deltaTime);
        }, 100);
    }

    update(deltaTime) {
        if (!this.tutorialState.completed) {
            const currentStep = this.tutorialState.steps[this.tutorialState.currentStep];
            if (currentStep?.requirement) {
                if (currentStep.trigger === 'canHireTech' && this.data >= currentStep.requirement) {
                    this.showNextTutorialStep('canHireTech', this.data);
                }
                else if (currentStep.trigger === 'canHireManager' && this.data >= currentStep.requirement) {
                    this.showNextTutorialStep('canHireManager', this.data);
                }
            }
        }
        
        this.updateDisplay();
    }

    setupPanelHandlers() {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            // Remove any existing click listeners
            button.removeEventListener('click', this.handlePanelClick);
            
            // Create bound handler
            this.handlePanelClick = (e) => {
                const panelId = button.getAttribute('data-panel');
                
                if (button.classList.contains('disabled')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (panelId === 'managersPanel') {
                        this.showNotification('You need to hire at least one Technician to unlock the Managers panel');
                    } else if (panelId === 'upgradesPanel') {
                        this.showNotification('You need to hire at least two Technicians to unlock the Upgrades panel');
                    }
                    return false;
                }
                
                this.switchPanel(panelId);
            };

            // Add click listener
            button.addEventListener('click', this.handlePanelClick.bind(this));
            
            // Prevent default action on disabled buttons
            if (button.classList.contains('disabled')) {
                button.addEventListener('mousedown', (e) => e.preventDefault());
                button.addEventListener('touchstart', (e) => e.preventDefault());
            }
        });
    }

    switchPanel(panelId) {
        // Hide current panel
        document.getElementById(this.currentPanel).classList.remove('active');
        document.querySelector(`[data-panel="${this.currentPanel}"]`).classList.remove('active');
        
        // Show new panel
        document.getElementById(panelId).classList.add('active');
        document.querySelector(`[data-panel="${panelId}"]`).classList.add('active');
        
        this.currentPanel = panelId;
    }

    initializePanelStates() {
        // Initially disable managers and upgrades panels
        const managersButton = document.querySelector('[data-panel="managersPanel"]');
        const upgradesButton = document.querySelector('[data-panel="upgradesPanel"]');
        
        if (managersButton) managersButton.classList.add('disabled');
        if (upgradesButton) upgradesButton.classList.add('disabled');
    }

    handleEmployeeHire(roleName, empId) {
        const employee = this.roles[roleName].employees[empId];
        if (!employee.owned && this.data >= employee.cost) {
            this.data -= employee.cost;
            employee.owned = true;
            
            // Update display
            this.updateEmployeeDisplay(roleName, empId);
            
            // Re-setup employee handlers
            this.setupEmployeeHandlers();
            
            // Update general display
            this.updateDisplay();
            
            // Show notification
            this.showNotification(`Hired ${empId.charAt(0).toUpperCase() + empId.slice(1)}!`);
            
            // Check unlocks and tutorial
            this.checkUnlocks();
            
            if (this.countOwnedEmployees('technician') === 1) {
                this.showNextTutorialStep('techHired');
                // Highlight the progress bar
                const progressBar = document.querySelector(`.progress-bar[data-employee="${empId}"]`);
                if (progressBar) {
                    progressBar.classList.add('tutorial-highlight');
                }
            }
        }
    }

    handleManagerHire(managerId) {
        const manager = this.roles.manager.employees[managerId];
        if (!manager.owned && this.data >= manager.cost) {
            this.data -= manager.cost;
            manager.owned = true;
            
            // Find first non-automated technician and automate it
            const techs = Object.entries(this.roles.technician.employees);
            for (const [techId, tech] of techs) {
                if (tech.owned && !tech.automated) {
                    tech.automated = true;
                    this.updateEmployeeAutomationStatus(techId);
                    // Start the automated task immediately
                    this.startTask('technician', techId);
                    break;
                }
            }
            
            // Update manager display
            this.updateManagerDisplay(managerId);
            this.updateDisplay();
            
            // Show notification
            this.showNotification('Junior Manager hired! Your Technician is now automated.');
            this.showNextTutorialStep('managerHired');
        }
    }

    checkUnlocks() {
        const techCount = this.countOwnedEmployees('technician');
        
        // Managers panel unlock
        const managersButton = document.querySelector('[data-panel="managersPanel"]');
        if (managersButton) {
            if (techCount >= 1) {
                managersButton.classList.remove('disabled');
                if (this.data >= 100) {
                    this.showNextTutorialStep('canHireManager', this.data);
                }
            }
        }
        
        // Upgrades panel unlock
        const upgradesButton = document.querySelector('[data-panel="upgradesPanel"]');
        if (upgradesButton) {
            if (techCount >= 2) {
                upgradesButton.classList.remove('disabled');
                this.showNextTutorialStep('upgradesUnlocked');
            }
        }
    }

    countOwnedEmployees(roleName) {
        if (!this.roles[roleName]) return 0;
        return Object.values(this.roles[roleName].employees)
            .filter(emp => emp.owned).length;
    }

    updateManagerAvailability() {
        Object.entries(this.roles).forEach(([roleName, role]) => {
            Object.entries(role.employees).forEach(([empId, employee]) => {
                if (employee.owned && !employee.automated) {
                    const managerCard = document.querySelector(`#${empId}Manager`);
                    if (managerCard) {
                        managerCard.classList.remove('hidden');
                    }
                }
            });
        });
    }

    calculateDataPerSecond() {
        let dps = 0;
        Object.entries(this.roles).forEach(([roleName, role]) => {
            Object.entries(role.employees).forEach(([empId, employee]) => {
                if (employee.owned) {
                    const baseReward = employee.baseReward;
                    const taskTime = employee.baseTaskTime / 1000; // Convert to seconds
                    dps += baseReward / taskTime;
                }
            });
        });
        return Math.round(dps);
    }

    updateEmployeeDisplay(roleName, empId) {
        const card = document.getElementById(`${empId}Card`);
        if (!card) return;

        const employee = this.roles[roleName].employees[empId];
        const hireSection = card.querySelector('.hire-section');
        const activeSection = card.querySelector('.employee-active');

        if (employee.owned) {
            if (hireSection) hireSection.style.display = 'none';
            if (activeSection) {
                activeSection.style.display = 'block';
                const progressBar = activeSection.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.setAttribute('data-employee', empId);
                    // Remove old click listener
                    progressBar.onclick = null;
                    // Add new click listener
                    progressBar.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (employee.owned) {
                            this.startTask(roleName, empId);
                        }
                    };
                }
            }
        } else {
            if (hireSection) hireSection.style.display = 'block';
            if (activeSection) activeSection.style.display = 'none';
        }
    }

    showNotification(message, type = 'default') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        const notificationIcon = notification.querySelector('i');
        
        if (!notification || !notificationText) return;

        // Remove any existing click handlers
        notification.onclick = null;

        if (type === 'tutorial') {
            notificationIcon.className = 'fas fa-graduation-cap';
            notification.classList.add('tutorial');
            notification.classList.remove('achievement');
            notification.style.cursor = 'default';
        } else if (type === 'achievement') {
            notificationIcon.className = 'fas fa-trophy';
            notification.classList.add('achievement');
            notification.classList.remove('tutorial');
            notification.style.cursor = 'pointer';
            notification.onclick = (e) => {
                e.stopPropagation();
                this.switchPanel('achievementsPanel');
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.style.display = 'none';
                    notification.style.opacity = '1';
                }, 300);
            };
        } else {
            notificationIcon.className = 'fas fa-info-circle';
            notification.classList.remove('tutorial', 'achievement');
            notification.style.cursor = 'default';
        }

        notificationText.textContent = message;
        notification.style.display = 'block';
        notification.style.opacity = '1';
        
        const duration = type === 'tutorial' ? 5000 : 3000;
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        // Don't auto-hide achievement notifications
        if (type !== 'achievement') {
            this.notificationTimeout = setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.style.display = 'none';
                    notification.style.opacity = '1';
                }, 300);
            }, duration);
        }
    }

    setupHireHandlers() {
        // Set up hire button handlers for each employee
        Object.keys(this.roles).forEach(roleName => {
            Object.keys(this.roles[roleName].employees).forEach(empId => {
                const hireButton = document.getElementById(`hire${empId.charAt(0).toUpperCase() + empId.slice(1)}`);
                if (hireButton) {
                    hireButton.addEventListener('click', () => {
                        this.handleEmployeeHire(roleName, empId);
                    });
                }
            });
        });
    }

    areAllEmployeesAutomated(roleName) {
        if (!this.roles[roleName]) return false;
        const employees = Object.values(this.roles[roleName].employees);
        return employees.length > 0 && employees.every(emp => emp.owned && emp.automated);
    }

    automateEmployee(roleName, empId) {
        if (this.roles[roleName]?.employees[empId]) {
            this.roles[roleName].employees[empId].automated = true;
            this.updateEmployeeDisplay(roleName, empId);
        }
    }

    setupSettingsHandlers() {
        // Export save
        document.getElementById('exportSave')?.addEventListener('click', () => {
            const saveData = this.getSaveData();
            const blob = new Blob([JSON.stringify(saveData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'it-empire-save.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // Import save
        document.getElementById('importSave')?.addEventListener('click', () => {
            document.getElementById('saveFileInput').click();
        });

        document.getElementById('saveFileInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const saveData = JSON.parse(e.target.result);
                        this.loadSaveData(saveData);
                        this.showNotification('Game data imported successfully!');
                    } catch (error) {
                        this.showNotification('Error importing save file!');
                    }
                };
                reader.readAsText(file);
            }
        });

        // Reset game
        document.getElementById('resetGame')?.addEventListener('click', () => {
            const modal = document.getElementById('confirmationModal');
            const message = document.getElementById('confirmationMessage');
            
            if (modal && message) {
                message.textContent = 'Are you sure you want to reset all progress? This cannot be undone.';
                modal.style.display = 'block';

                const handleYes = () => {
                    this.resetGame();
                    modal.style.display = 'none';
                    this.showNotification('Game has been reset');
                    cleanup();
                };

                const handleNo = () => {
                    modal.style.display = 'none';
                    cleanup();
                };

                const cleanup = () => {
                    document.getElementById('confirmYes').removeEventListener('click', handleYes);
                    document.getElementById('confirmNo').removeEventListener('click', handleNo);
                };

                document.getElementById('confirmYes').addEventListener('click', handleYes);
                document.getElementById('confirmNo').addEventListener('click', handleNo);
            }
        });

        // Manual save button
        document.getElementById('manualSave')?.addEventListener('click', () => {
            this.saveGame();
            this.showNotification('Game saved successfully!');
        });

        // Settings changes
        document.getElementById('notificationDuration')?.addEventListener('change', (e) => {
            this.settings.notificationDuration = parseInt(e.target.value);
            this.saveGame(); // Save when settings change
        });

        document.getElementById('progressAnimation')?.addEventListener('change', (e) => {
            this.settings.progressAnimation = e.target.value;
            this.saveGame(); // Save when settings change
        });
    }

    resetGame() {
        // Reset base properties
        this.data = 0;
        this.clickValue = 1;
        
        // Reset statistics
        this.statistics = {
            totalDataGenerated: 0,
            totalClicks: 0,
            peakDPS: 0,
            timeSpentPlaying: 0
        };
        
        // Reset roles and employees
        this.roles = {
            technician: {
                employees: {
                    tech1: { owned: false, automated: false, cost: 25, baseReward: 15, baseTaskTime: 8000 },
                    tech2: { owned: false, automated: false, cost: 250, baseReward: 75, baseTaskTime: 12000 },
                    tech3: { owned: false, automated: false, cost: 2500, baseReward: 375, baseTaskTime: 16000 }
                }
            },
            manager: {
                employees: {
                    techManager1: { owned: false, cost: 100, manages: 'technician' }
                }
            }
        };
        
        // Reset achievement bonuses
        this.achievementBonuses = {
            taskSpeed: 0,
            income: 0,
            clickValue: 0
        };

        // Clear all task timers
        Object.keys(this.taskTimers).forEach(timerId => {
            clearInterval(this.taskTimers[timerId]);
        });
        this.taskTimers = {};

        // Reset tutorial state
        this.tutorialState.currentStep = 0;
        this.tutorialState.completed = false;
        
        // Update display
        this.updateDisplay();
        this.checkUnlocks();
    }

    // Clean up method to prevent memory leaks
    cleanup() {
        this.stopAutoClick();
        
        // Clear auto-save interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }

    countTotalEmployees() {
        let total = 0;
        Object.values(this.roles).forEach(role => {
            total += Object.values(role.employees).filter(emp => emp.owned).length;
        });
        return total;
    }

    // Add method to stop auto-clicking
    stopAutoClick() {
        if (this.holdIntervalId) {
            clearInterval(this.holdIntervalId);
            this.holdIntervalId = null;
        }
    }

    // Add this method to test notifications
    testNotification() {
        this.showNotification('Test notification');
    }

    startAutoSave() {
        // Save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    saveGame() {
        const saveData = this.getSaveData();
        try {
            localStorage.setItem('itEmpireSave', JSON.stringify(saveData));
            const saveIndicator = document.getElementById('saveIndicator');
            if (saveIndicator) {
                saveIndicator.classList.add('show');
                setTimeout(() => {
                    saveIndicator.classList.remove('show');
                }, 2000);
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save game!');
        }
    }

    loadGame() {
        try {
            const savedGame = localStorage.getItem('itEmpireSave');
            if (savedGame) {
                const saveData = JSON.parse(savedGame);
                
                // Load saved data without resetting first
                this.data = saveData.data || 0;
                this.clickValue = saveData.clickValue || 1;
                this.statistics = saveData.statistics || this.statistics;
                this.roles = saveData.roles || this.roles;
                this.achievementBonuses = saveData.achievementBonuses || this.achievementBonuses;
                this.tutorialState = saveData.tutorialState || this.tutorialState;
                
                // Calculate offline progress
                const timeDiff = Date.now() - (saveData.lastSaveTime || Date.now());
                if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) {
                    this.calculateOfflineProgress(timeDiff);
                }
                
                // Update displays and restore automated tasks
                this.updateDisplay();
                this.checkUnlocks();
                this.restoreAutomatedTasks();
                this.updateAllEmployeeDisplays();
            }
        } catch (error) {
            console.error('Load error:', error);
            this.showNotification('Failed to load save data!');
        }
    }

    calculateOfflineProgress(timeDiff) {
        // Convert time difference from milliseconds to seconds
        const secondsOffline = timeDiff / 1000;
        
        // Calculate data generated while offline
        const dps = this.calculateDataPerSecond();
        const offlineData = Math.floor(dps * secondsOffline);
        
        if (offlineData > 0) {
            this.data += offlineData;
            this.showNotification(`While you were away, you generated ${offlineData} GB!`);
        }
    }

    getSaveData() {
        return {
            version: '0.1.0', // Add version tracking
            data: this.data,
            clickValue: this.clickValue,
            statistics: this.statistics,
            roles: this.roles,
            achievementBonuses: this.achievementBonuses,
            settings: this.settings,
            tutorialState: this.tutorialState,
            lastSaveTime: Date.now()
        };
    }

    loadSaveData(saveData) {
        this.data = saveData.data;
        this.clickValue = saveData.clickValue;
        this.statistics = saveData.statistics;
        this.roles = saveData.roles;
        this.achievementBonuses = saveData.achievementBonuses;
        
        // Load settings if they exist in the save file
        if (saveData.settings) {
            this.settings = saveData.settings;
            this.applySettings();
        }
        
        this.updateDisplay();
    }

    applySettings() {
        // Apply notification duration
        if (document.getElementById('notificationDuration')) {
            document.getElementById('notificationDuration').value = this.settings.notificationDuration;
        }
        
        // Apply progress animation
        if (document.getElementById('progressAnimation')) {
            document.getElementById('progressAnimation').value = this.settings.progressAnimation;
        }
        
        // Future: Apply theme and color scheme
    }

    // Add this method to help with debugging
    debugSaveLoad() {
        console.log('Current game state:', this.getSaveData());
        console.log('Saved game state:', JSON.parse(localStorage.getItem('itEmpireSave')));
    }

    loadTutorialState() {
        const savedState = localStorage.getItem('tutorialState');
        if (savedState) {
            this.tutorialState.completed = JSON.parse(savedState).completed;
            this.tutorialState.currentStep = JSON.parse(savedState).currentStep;
        } else {
            this.showNextTutorialStep('start');
        }
    }

    saveTutorialState() {
        localStorage.setItem('tutorialState', JSON.stringify({
            completed: this.tutorialState.completed,
            currentStep: this.tutorialState.currentStep
        }));
    }

    showNextTutorialStep(trigger, value = null) {
        if (this.tutorialState.completed) return;

        const currentStep = this.tutorialState.steps[this.tutorialState.currentStep];
        if (!currentStep) {
            this.tutorialState.completed = true;
            this.saveTutorialState();
            return;
        }

        if (currentStep.trigger === trigger) {
            if (currentStep.requirement && value < currentStep.requirement) {
                return;
            }

            this.showNotification(currentStep.message, 'tutorial');
            this.tutorialState.currentStep++;
            this.saveTutorialState();
        }
    }

    startTask(roleName, empId) {
        const employee = this.roles[roleName].employees[empId];
        if (!employee.owned) return;

        const progressBar = document.querySelector(`.progress-bar[data-employee="${empId}"]`);
        const progressFill = progressBar?.querySelector('.progress-fill');
        const progressText = progressBar?.querySelector('.progress-text');
        
        if (!progressBar || !progressFill || !progressText) {
            console.error('Could not find progress bar elements for:', empId);
            return;
        }

        // Clear existing timer if any
        if (this.taskTimers[empId]) {
            clearInterval(this.taskTimers[empId]);
        }

        let progress = 0;
        const taskTime = employee.baseTaskTime * (1 - this.achievementBonuses.taskSpeed);
        const updateInterval = 100; // Update every 100ms

        progressFill.style.width = '0%';
        progressText.textContent = employee.automated ? 'Automated...' : 'Working...';

        this.taskTimers[empId] = setInterval(() => {
            progress += (updateInterval / taskTime) * 100;
            
            if (progress >= 100) {
                progress = 0;
                this.completeTask(roleName, empId);
            }
            
            progressFill.style.width = `${progress}%`;
        }, updateInterval);

        // Trigger tutorial step when first task is started
        if (!this.hasStartedFirstTask) {
            this.hasStartedFirstTask = true;
            this.showNextTutorialStep('taskStarted');
        }
    }

    completeTask(roleName, empId) {
        const employee = this.roles[roleName].employees[empId];
        const reward = Math.round(employee.baseReward * (1 + this.achievementBonuses.income));
        this.data += reward;
        this.statistics.totalDataGenerated += reward;
        this.updateDisplay();

        // Clear the task timer
        if (this.taskTimers[empId]) {
            clearInterval(this.taskTimers[empId]);
            this.taskTimers[empId] = null;
        }

        // If automated, restart task
        if (employee.automated) {
            this.startTask(roleName, empId);
        } else {
            // Reset progress bar
            const progressBar = document.querySelector(`.progress-bar[data-employee="${empId}"]`);
            const progressFill = progressBar?.querySelector('.progress-fill');
            const progressText = progressBar?.querySelector('.progress-text');
            
            if (progressFill && progressText) {
                progressFill.style.width = '0%';
                progressText.textContent = 'Click to start task';
            }
        }
    }

    setupEmployeeHandlers() {
        Object.keys(this.roles).forEach(roleName => {
            Object.keys(this.roles[roleName].employees).forEach(empId => {
                const progressBar = document.querySelector(`.progress-bar[data-employee="${empId}"]`);
                if (progressBar) {
                    // Remove any existing listeners first
                    const newProgressBar = progressBar.cloneNode(true);
                    progressBar.parentNode.replaceChild(newProgressBar, progressBar);
                    
                    newProgressBar.addEventListener('click', (e) => {
                        e.preventDefault();
                        const employee = this.roles[roleName].employees[empId];
                        if (employee.owned) {
                            console.log('Starting task for:', empId); // Debug log
                            this.startTask(roleName, empId);
                        }
                    });
                }
            });
        });
    }

    applyAchievementReward(type, amount) {
        switch (type.toLowerCase()) {  // Convert to lowercase for case-insensitive comparison
            case 'taskspeed':
            case 'task speed':  // Handle both formats
                this.achievementBonuses.taskSpeed += amount;
                break;
            case 'income':
                this.achievementBonuses.income += amount;
                break;
            case 'clickvalue':
            case 'click value':  // Handle both formats
                this.achievementBonuses.clickValue += amount;
                break;
            default:
                console.warn('Unknown achievement reward type:', type);
        }
        
        // Update display after applying reward
        this.updateDisplay();
    }

    updateAchievementCounts() {
        const totalAchievements = document.getElementById('totalAchievements');
        const achievementCount = document.getElementById('achievementCount');
        const completionText = document.querySelector('.completion-text');
        const completionFill = document.querySelector('.completion-fill');

        if (totalAchievements && achievementCount && completionText && completionFill) {
            const total = AchievementSystem.getTotalAchievements();
            const completed = AchievementSystem.getCompletedAchievements();
            const percentage = Math.round((completed / total) * 100);

            totalAchievements.textContent = total;
            achievementCount.textContent = completed;
            completionText.textContent = `${percentage}% Complete`;
            completionFill.style.width = `${percentage}%`;
        }
    }

    setupManagerHandlers() {
        Object.keys(this.roles.manager.employees).forEach(managerId => {
            const hireButton = document.getElementById(`hire${managerId.charAt(0).toUpperCase() + managerId.slice(1)}`);
            if (hireButton) {
                hireButton.addEventListener('click', () => {
                    this.handleManagerHire(managerId);
                });
            }
        });
    }

    restoreAutomatedTasks() {
        Object.keys(this.roles).forEach(roleName => {
            Object.keys(this.roles[roleName].employees).forEach(empId => {
                const employee = this.roles[roleName].employees[empId];
                if (employee.owned && employee.automated) {
                    this.startTask(roleName, empId);
                }
            });
        });
    }

    updateManagerDisplay(managerId) {
        const card = document.getElementById(`${managerId}Card`);
        if (!card) return;

        const manager = this.roles.manager.employees[managerId];
        const button = card.querySelector('.manager-button');
        
        if (manager.owned) {
            button.classList.add('owned');
            button.disabled = true;
            button.innerHTML = `
                <i class="fas fa-user-tie"></i>
                <span class="title">Junior Manager</span>
                <span class="description">Managing Technician</span>
                <span class="status">Active</span>
            `;
        }
    }

    // Add this new method to update all employee displays
    updateAllEmployeeDisplays() {
        Object.keys(this.roles).forEach(roleName => {
            Object.keys(this.roles[roleName].employees).forEach(empId => {
                if (this.roles[roleName].employees[empId].owned) {
                    this.updateEmployeeDisplay(roleName, empId);
                }
            });
        });
    }

    // Add new method to update automation status
    updateEmployeeAutomationStatus(empId) {
        const employeeCard = document.getElementById(`${empId}Card`);
        if (!employeeCard) return;

        const progressBar = employeeCard.querySelector('.progress-bar');
        const employeeInfo = employeeCard.querySelector('.employee-info');
        
        if (progressBar && employeeInfo) {
            // Remove any existing automation status
            const existingStatus = employeeInfo.querySelector('.automation-status');
            if (existingStatus) {
                existingStatus.remove();
            }

            // Add automated class for styling
            progressBar.classList.add('automated');
            
            // Add automation indicator
            const automationStatus = document.createElement('div');
            automationStatus.className = 'automation-status';
            automationStatus.innerHTML = '<i class="fas fa-cog fa-spin"></i> Automated';
            employeeInfo.appendChild(automationStatus);
        }
    }
}

// Create game instance when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
}); 