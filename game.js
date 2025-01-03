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
                    techManager1: { owned: false, cost: 100, manages: 'tech1' },
                    techManager2: { owned: false, cost: 1000, manages: 'tech2' },
                    techManager3: { owned: false, cost: 10000, manages: 'tech3' }
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

        // Initialize save-related properties
        this.autoSaveInterval = null;
        this.lastSaveTime = Date.now();

        // Initialize the game
        this.initialize();

        // Add page unload handler
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });

        this.hasShownTechTutorial = false;
    }

    initialize() {
        // First load save data
        this.loadGame();
        
        // Set up basic handlers
        this.setupClickHandlers();
        this.setupPanelHandlers();
        this.setupHireHandlers();
        this.setupEmployeeHandlers();
        this.setupUpgradeHandlers();
        this.setupSettingsHandlers();
        
        // Update display first time
        this.updateDisplay();
        
        // Set up manager handlers last (since they depend on DOM elements)
        setTimeout(() => {
            this.setupManagerHandlers();
        }, 0);
        
        // Start game systems
        this.startGameLoop();
        this.startAutoSave();
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
        if (!this.hasShownTechTutorial && this.data >= 25) {
            this.hasShownTechTutorial = true;
            this.showNextTutorialStep('canHireTech');
        }
    }

    updateDisplay() {
        // Update data display
        const dataDisplay = document.getElementById('dataDisplay');
        if (dataDisplay) {
            dataDisplay.textContent = Math.floor(this.data);
        }

        // Update DPS display
        const dpsDisplay = document.getElementById('dpsDisplay');
        if (dpsDisplay) {
            const dps = this.calculateDPS();
            dpsDisplay.textContent = Math.round(dps);
            
            // Update peak DPS if current DPS is higher
            if (dps > this.statistics.peakDPS) {
                this.statistics.peakDPS = dps;
            }
        }

        // Update click value display
        const clickValueDisplay = document.getElementById('clickValueDisplay');
        if (clickValueDisplay) {
            const totalClickValue = Math.round(this.clickValue * (1 + this.achievementBonuses.clickValue));
            clickValueDisplay.textContent = totalClickValue;
        }

        // Update technician buttons
        this.updateTechnicianButtons();

        // Check for unlocks
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
            employee.automated = false; // Make sure automation is off by default

            // Show the active section and hide hire section
            const card = document.getElementById(`${empId}Card`);
            if (card) {
                const hireSection = card.querySelector('.hire-section');
                const activeSection = card.querySelector('.employee-active');
                
                if (hireSection && activeSection) {
                    hireSection.style.display = 'none';
                    activeSection.style.display = 'block';
                }
            }

            // Update displays
            this.updateEmployeeDisplay(roleName, empId);
            this.updateDisplay();
            
            // Show notification
            this.showNotification(`${this.getTechnicianTitle(empId)} hired!`);

            // Check for tutorial progress
            if (empId === 'tech1') {
                this.showNextTutorialStep('techHired');
            }

            // Check unlocks
            this.checkUnlocks();
        }
    }

    handleManagerHire(managerId) {
        const manager = this.roles.manager.employees[managerId];
        if (!manager.owned && this.data >= manager.cost) {
            // Purchase the manager
            this.data -= manager.cost;
            manager.owned = true;
            
            // Update UI
            const button = document.getElementById(`hire${managerId}`);
            if (button) {
                button.classList.add('owned');
                button.disabled = true;
                button.innerHTML = `
                    <div class="manager-icon">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="manager-info">
                        <span class="title">${this.getManagerTitle(managerId)}</span>
                        <div class="status">
                            <i class="fas fa-check-circle"></i>
                            Managing ${this.getTechnicianTitle(manager.manages)}
                        </div>
                    </div>
                `;
            }

            // Start automation
            const targetTech = manager.manages;
            if (this.roles.technician.employees[targetTech]) {
                this.roles.technician.employees[targetTech].automated = true;
                this.automateEmployee(managerId);
            }
            
            // Update display
            this.updateDisplay();
            
            // Show notification
            this.showNotification(`${this.getManagerTitle(managerId)} hired! ${this.getTechnicianTitle(manager.manages)} is now automated.`);
            
            // Save the game
            this.saveGame();
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
        
        // Calculate DPS from technicians
        Object.entries(this.roles.technician.employees).forEach(([techId, tech]) => {
            if (tech.owned) {
                const baseReward = tech.baseReward;
                const taskTime = tech.baseTaskTime / 1000; // Convert to seconds
                const rewardPerSecond = baseReward / taskTime;
                dps += rewardPerSecond;
            }
        });
        
        // Apply income bonus if any
        if (this.achievementBonuses.income) {
            dps *= (1 + this.achievementBonuses.income);
        }
        
        return Math.round(dps * 10) / 10; // Round to 1 decimal place
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
        // Handle technician hiring
        Object.entries(this.roles.technician.employees).forEach(([techId, tech]) => {
            const button = document.getElementById(`hire${techId.charAt(0).toUpperCase() + techId.slice(1)}`);
            if (!button) {
                console.error(`Hire button not found for ${techId}`);
                return;
            }

            // Remove any existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            newButton.addEventListener('click', () => {
                if (this.data >= tech.cost && !tech.owned) {
                    this.handleEmployeeHire('technician', techId);
                }
            });
        });
    }

    areAllEmployeesAutomated(roleName) {
        if (!this.roles[roleName]) return false;
        const employees = Object.values(this.roles[roleName].employees);
        return employees.length > 0 && employees.every(emp => emp.owned && emp.automated);
    }

    automateEmployee(managerId) {
        const manager = this.roles.manager.employees[managerId];
        const targetTech = manager.manages;
        const employee = this.roles.technician.employees[targetTech];
        
        if (!employee || !employee.owned) {
            console.error('Target employee not found or not owned:', targetTech);
            return;
        }

        // Mark the employee as automated
        employee.automated = true;
        
        // Update the progress bar appearance
        const progressBar = document.querySelector(`#${targetTech}Card .progress-bar`);
        if (progressBar) {
            progressBar.classList.add('automated');
            const progressText = progressBar.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = 'Automated';
            }
        }
        
        // Start the automation loop
        this.startTask('technician', targetTech);
    }

    setupSettingsHandlers() {
        const resetButton = document.getElementById('resetGame');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset the game? This will delete all progress and cannot be undone.')) {
                    this.resetGame();
                }
            });
        }

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
        // Clear all local storage
        localStorage.removeItem('gameState');
        localStorage.removeItem('tutorialState');
        localStorage.removeItem('itEmpireSave');
        
        // Clear all intervals
        Object.keys(this.taskTimers).forEach(timer => {
            clearInterval(this.taskTimers[timer]);
        });
        
        // Clear auto-save interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Reload the page to start fresh
        window.location.reload();
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
        const savedData = localStorage.getItem('itEmpireSave');
        if (savedData) {
            try {
                const loadedState = JSON.parse(savedData);
                
                // Restore game state
                this.data = loadedState.data || 0;
                this.clickValue = loadedState.clickValue || 1;
                this.statistics = loadedState.statistics || this.statistics;
                this.achievementBonuses = loadedState.achievementBonuses || this.achievementBonuses;
                
                // Restore employee states
                if (loadedState.roles) {
                    Object.entries(loadedState.roles).forEach(([roleName, role]) => {
                        Object.entries(role.employees).forEach(([empId, employee]) => {
                            if (employee.owned) {
                                this.roles[roleName].employees[empId].owned = true;
                                this.roles[roleName].employees[empId].automated = employee.automated || false;
                                
                                // Update the UI for owned employees
                                this.updateEmployeeDisplay(roleName, empId);
                            }
                        });
                    });
                }

                // Restore manager states and automation
                if (loadedState.roles?.manager?.employees) {
                    Object.entries(loadedState.roles.manager.employees).forEach(([managerId, manager]) => {
                        if (manager.owned) {
                            this.roles.manager.employees[managerId].owned = true;
                            // Update manager UI
                            const button = document.getElementById(`hire${managerId}`);
                            if (button) {
                                button.classList.add('owned');
                                button.disabled = true;
                                button.innerHTML = `
                                    <div class="manager-icon">
                                        <i class="fas fa-user-tie"></i>
                                    </div>
                                    <div class="manager-info">
                                        <span class="title">${this.getManagerTitle(managerId)}</span>
                                        <div class="status">
                                            <i class="fas fa-check-circle"></i>
                                            Managing ${this.getTechnicianTitle(manager.manages)}
                                        </div>
                                    </div>
                                `;
                            }
                            // Restart automation
                            this.automateEmployee(managerId);
                        }
                    });
                }

                // Update all displays
                this.updateDisplay();
                this.checkUnlocks();

                // Calculate offline progress
                if (loadedState.lastSaveTime) {
                    const timeDiff = Date.now() - loadedState.lastSaveTime;
                    this.calculateOfflineProgress(timeDiff);
                }
            } catch (error) {
                console.error('Error loading save:', error);
            }
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
        console.log('Starting task for:', empId);
        const employee = this.roles[roleName].employees[empId];
        if (!employee || !employee.owned) return;

        // Don't start a new task if one is already in progress
        if (this.taskTimers[empId]) return;

        const progressBar = document.querySelector(`#${empId}Card .progress-bar`);
        const progressFill = progressBar?.querySelector('.progress-fill');
        const progressText = progressBar?.querySelector('.progress-text');
        
        if (!progressBar || !progressFill || !progressText) {
            console.error('Progress elements not found for:', empId);
            return;
        }

        let progress = 0;
        const taskTime = this.calculateTaskTime(employee.baseTaskTime);
        const updateInterval = 50; // More frequent updates for smoother animation

        progressFill.style.width = '0%';
        progressText.textContent = employee.automated ? 'Automated' : 'Working...';

        // Clear any existing timer
        if (this.taskTimers[empId]) {
            clearInterval(this.taskTimers[empId]);
        }

        this.taskTimers[empId] = setInterval(() => {
            progress += (updateInterval / taskTime) * 100;
            
            if (progress >= 100) {
                this.completeTask(roleName, empId);
                progress = 0;
                progressFill.style.width = '0%';
                
                // If not automated, clear the timer and reset text
                if (!employee.automated) {
                    clearInterval(this.taskTimers[empId]);
                    this.taskTimers[empId] = null;
                    progressText.textContent = 'Click to start task';
                }
            } else {
                progressFill.style.width = `${progress}%`;
            }
        }, updateInterval);
    }

    calculateTaskTime(baseTime) {
        return baseTime * (1 - (this.achievementBonuses.taskSpeed || 0));
    }

    completeTask(roleName, empId) {
        const employee = this.roles[roleName].employees[empId];
        if (!employee || !employee.owned) return;

        // Calculate reward with bonuses
        let reward = employee.baseReward;
        if (this.achievementBonuses.income) {
            reward *= (1 + this.achievementBonuses.income);
        }

        // Apply efficiency bonus (chance for double reward)
        if (this.achievementBonuses.efficiency && Math.random() < this.achievementBonuses.efficiency) {
            reward *= 2;
        }

        // Add the reward
        reward = Math.round(reward);
        this.data += reward;
        this.statistics.totalDataGenerated += reward;

        // Update display
        this.updateDisplay();
    }

    setupEmployeeHandlers() {
        Object.entries(this.roles.technician.employees).forEach(([empId, employee]) => {
            const progressBar = document.querySelector(`#${empId}Card .progress-bar`);
            if (progressBar) {
                progressBar.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (employee.owned && !employee.automated) {
                        console.log('Progress bar clicked for:', empId);
                        this.startTask('technician', empId);
                    }
                };
            }
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
        // Create a mapping of manager IDs to their display names and costs
        const managerConfig = {
            'techManager1': { title: 'Junior Tech Manager', cost: 100, manages: 'tech1' },
            'techManager2': { title: 'Tech Manager', cost: 1000, manages: 'tech2' },
            'techManager3': { title: 'Senior Tech Manager', cost: 10000, manages: 'tech3' }
        };

        // Wait for DOM to be ready
        const initializeManagers = () => {
            Object.entries(managerConfig).forEach(([managerId, config]) => {
                const button = document.getElementById(`hire${managerId}`);
                if (!button) {
                    // Instead of logging an error, try again later if button not found
                    setTimeout(initializeManagers, 100);
                    return;
                }

                // Remove any existing listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);

                // Update button state if manager is owned
                const manager = this.roles.manager.employees[managerId];
                if (manager && manager.owned) {
                    newButton.classList.add('owned');
                    newButton.disabled = true;
                    newButton.innerHTML = `
                        <div class="manager-icon">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="manager-info">
                            <span class="title">${this.getManagerTitle(managerId)}</span>
                            <div class="status">
                                <i class="fas fa-check-circle"></i>
                                Managing ${this.getTechnicianTitle(manager.manages)}
                            </div>
                        </div>
                    `;
                }

                newButton.addEventListener('click', () => {
                    if (this.data >= manager.cost && !manager.owned) {
                        this.handleManagerHire(managerId);
                    }
                });
            });
        };

        // Start the initialization process
        initializeManagers();
    }

    getManagerTitle(managerId) {
        const titles = {
            techManager1: 'Junior Tech Manager',
            techManager2: 'Tech Manager',
            techManager3: 'Senior Tech Manager'
        };
        return titles[managerId] || 'Manager';
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

    updateTechnicianButtons() {
        Object.entries(this.roles.technician.employees).forEach(([techId, tech]) => {
            const button = document.getElementById(`hire${techId.charAt(0).toUpperCase() + techId.slice(1)}`);
            if (button) {
                // Enable/disable based on cost
                button.disabled = this.data < tech.cost || tech.owned;
                
                // Update button appearance based on affordability
                if (this.data >= tech.cost && !tech.owned) {
                    button.classList.add('affordable');
                } else {
                    button.classList.remove('affordable');
                }
            }
        });
    }

    getTechnicianTitle(techId) {
        const titles = {
            tech1: 'Technician I',
            tech2: 'Technician II',
            tech3: 'Technician III'
        };
        return titles[techId] || 'Technician';
    }

    handleUpgradePurchase(upgradeId) {
        const upgradeButton = document.getElementById(upgradeId);
        if (!upgradeButton) return;

        const costElement = upgradeButton.querySelector('.cost');
        if (!costElement) return;

        const cost = parseInt(costElement.textContent);
        if (isNaN(cost) || this.data < cost) return;

        this.data -= cost;
        
        // Apply the upgrade effect based on the ID
        switch (upgradeId) {
            case 'taskSpeedUpgrade':
                this.achievementBonuses.taskSpeed += 0.1; // 10% faster tasks
                break;
            case 'revenueUpgrade':
                this.achievementBonuses.income += 0.25; // 25% more income
                break;
            case 'automationUpgrade':
                this.achievementBonuses.automation += 0.2; // 20% faster automation
                break;
            case 'efficiencyUpgrade':
                this.achievementBonuses.efficiency += 0.25; // 25% double reward chance
                break;
        }

        // Update the level display
        const levelSpan = upgradeButton.querySelector(`#${upgradeId}Level`);
        if (levelSpan) {
            const currentLevel = parseInt(levelSpan.textContent) || 0;
            levelSpan.textContent = currentLevel + 1;
        }

        // Update cost for next level
        const newCost = Math.round(cost * 1.5);
        costElement.textContent = `${newCost} GB`;

        // Update game display
        this.updateDisplay();
        this.saveGame();
    }

    setupUpgradeHandlers() {
        const upgradeButtons = [
            'taskSpeedUpgrade',
            'revenueUpgrade',
            'automationUpgrade',
            'efficiencyUpgrade'
        ];

        upgradeButtons.forEach(upgradeId => {
            const button = document.getElementById(upgradeId);
            if (button) {
                button.addEventListener('click', () => this.handleUpgradePurchase(upgradeId));
            }
        });
    }
}

// Create game instance when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
}); 