// ===== AUTHENTICATION =====

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const errorDiv = document.getElementById('loginError');

        // Clear previous errors
        errorDiv.classList.remove('show');
        errorDiv.textContent = '';

        // Find user
        const user = Storage.findUser(email);

        if (!user) {
            errorDiv.textContent = '❌ Tài khoản không tồn tại. Vui lòng kiểm tra lại thông tin đăng nhập.';
            errorDiv.classList.add('show');
            return;
        }

        // Check password
        if (user.password !== password) {
            errorDiv.textContent = '❌ Mật khẩu không đúng. Vui lòng thử lại hoặc sử dụng "Quên mật khẩu".';
            errorDiv.classList.add('show');
            return;
        }

        // Success - login
        Storage.setCurrentUser(user.username);

        if (rememberMe) {
            localStorage.setItem('padoro_remember', 'true');
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');

        // Redirect to app
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 500);
    });
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');

        // Clear previous messages
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');
        errorDiv.textContent = '';
        successDiv.textContent = '';

        // Validation
        if (username.length < 3) {
            errorDiv.textContent = '❌ Tên đăng nhập phải có ít nhất 3 ký tự.';
            errorDiv.classList.add('show');
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = '❌ Mật khẩu phải có ít nhất 6 ký tự.';
            errorDiv.classList.add('show');
            return;
        }

        if (password !== confirmPassword) {
            errorDiv.textContent = '❌ Mật khẩu xác nhận không khớp.';
            errorDiv.classList.add('show');
            return;
        }

        if (!agreeTerms) {
            errorDiv.textContent = '❌ Vui lòng đồng ý với điều khoản sử dụng.';
            errorDiv.classList.add('show');
            return;
        }

        // Check if user already exists
        const users = Storage.getUsers();
        const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
        const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

        if (usernameExists) {
            errorDiv.textContent = '❌ Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.';
            errorDiv.classList.add('show');
            return;
        }

        if (emailExists) {
            errorDiv.textContent = '❌ Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.';
            errorDiv.classList.add('show');
            return;
        }

        // Create user
        const newUser = Storage.createUser(username, email, password);

        // Show success message
        successDiv.textContent = '✅ Đăng ký thành công! Đang chuyển đến trang đăng nhập...';
        successDiv.classList.add('show');

        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');

        // Redirect to login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
}

// Forgot Password Form
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
let resetEmail = '';

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('forgotEmail').value.trim();
        const errorDiv = document.getElementById('forgotError');
        const successDiv = document.getElementById('forgotSuccess');

        // Clear previous messages
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');
        errorDiv.textContent = '';
        successDiv.textContent = '';

        // Check if user exists
        const user = Storage.findUser(email);

        if (!user) {
            errorDiv.textContent = '❌ Email này chưa được đăng ký. Vui lòng kiểm tra lại.';
            errorDiv.classList.add('show');
            return;
        }

        // Generate and send reset code
        resetEmail = user.email;
        Storage.generateResetCode(resetEmail);

        // Show success and next step
        successDiv.textContent = '✅ Mã xác thực đã được gửi đến email của bạn!';
        successDiv.classList.add('show');

        // Show loading state
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');

        // Switch to reset form
        setTimeout(() => {
            forgotPasswordForm.style.display = 'none';
            resetPasswordForm.style.display = 'block';
        }, 1000);
    });
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const code = document.getElementById('verificationCode').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        const errorDiv = document.getElementById('resetError');
        const successDiv = document.getElementById('resetSuccess');

        // Clear previous messages
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');
        errorDiv.textContent = '';
        successDiv.textContent = '';

        // Validation
        if (code.length !== 6) {
            errorDiv.textContent = '❌ Mã xác thực phải có 6 chữ số.';
            errorDiv.classList.add('show');
            return;
        }

        if (newPassword.length < 6) {
            errorDiv.textContent = '❌ Mật khẩu phải có ít nhất 6 ký tự.';
            errorDiv.classList.add('show');
            return;
        }

        if (newPassword !== confirmPassword) {
            errorDiv.textContent = '❌ Mật khẩu xác nhận không khớp.';
            errorDiv.classList.add('show');
            return;
        }

        // Verify code
        if (!Storage.verifyResetCode(code)) {
            errorDiv.textContent = '❌ Mã xác thực không đúng hoặc đã hết hạn.';
            errorDiv.classList.add('show');
            return;
        }

        // Reset password
        const success = Storage.resetPassword(resetEmail, newPassword);

        if (success) {
            successDiv.textContent = '✅ Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...';
            successDiv.classList.add('show');

            // Show loading state
            const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');

            // Redirect to login
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            errorDiv.textContent = '❌ Có lỗi xảy ra. Vui lòng thử lại.';
            errorDiv.classList.add('show');
        }
    });

    // Resend code button
    const resendBtn = document.getElementById('resendCodeBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', () => {
            Storage.generateResetCode(resetEmail);

            const successDiv = document.getElementById('resetSuccess');
            successDiv.textContent = '✅ Mã xác thực mới đã được gửi!';
            successDiv.classList.add('show');

            setTimeout(() => {
                successDiv.classList.remove('show');
            }, 3000);
        });
    }
}
