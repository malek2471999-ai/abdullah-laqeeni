package com.abdullah.laqeeni.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.ui.components.Banner
import com.abdullah.laqeeni.ui.components.GradientScreen
import com.abdullah.laqeeni.ui.components.LaqeeniField
import com.abdullah.laqeeni.ui.components.LaqeeniLogo
import com.abdullah.laqeeni.ui.components.PrimaryButton
import com.abdullah.laqeeni.ui.components.SecondaryButton
import com.abdullah.laqeeni.ui.theme.ElectricBlue
import com.abdullah.laqeeni.ui.theme.Emerald
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import com.abdullah.laqeeni.ui.viewmodel.AuthViewModel

@Composable
fun LoginScreen(
    appViewModel: AppViewModel,
    onLoggedIn: () -> Unit,
    onRegister: () -> Unit,
) {
    val viewModel: AuthViewModel = hiltViewModel()
    val state = viewModel.state
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var forgotOpen by remember { mutableStateOf(false) }

    if (state.twoFactorRequired) {
        TwoFactorDialog(
            loading = state.loading,
            error = state.error,
            onDismiss = viewModel::backFromTwoFactor,
            onVerify = { code ->
                viewModel.verifyTwoFactor(code) {
                    appViewModel.refresh()
                    onLoggedIn()
                }
            },
        )
    }

    if (forgotOpen) {
        ForgotPasswordDialog(
            initialEmail = email,
            onDismiss = { forgotOpen = false },
            onSend = { value ->
                viewModel.forgotPassword(value)
                forgotOpen = false
            },
        )
    }

    GradientScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            LaqeeniLogo(size = 104.dp, animated = true)
            Spacer(Modifier.height(20.dp))
            Text(
                text = stringResource(R.string.app_name),
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = stringResource(R.string.slogan),
                style = MaterialTheme.typography.bodyMedium,
                color = Emerald,
            )
            Spacer(Modifier.height(34.dp))
            Text(
                text = stringResource(R.string.login_title),
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.login_subtitle),
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(22.dp))
            if (state.error != null) {
                Banner(state.error)
                Spacer(Modifier.height(12.dp))
            }
            if (state.message != null) {
                Banner(state.message, isError = false)
                Spacer(Modifier.height(12.dp))
            }
            LaqeeniField(
                value = email,
                onValueChange = { email = it },
                label = stringResource(R.string.email),
                leadingIcon = Icons.Filled.Email,
                keyboardType = KeyboardType.Email,
                enabled = !state.loading,
            )
            Spacer(Modifier.height(12.dp))
            LaqeeniField(
                value = password,
                onValueChange = { password = it },
                label = stringResource(R.string.password),
                leadingIcon = Icons.Filled.Lock,
                isPassword = true,
                enabled = !state.loading,
            )
            Spacer(Modifier.height(6.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = { forgotOpen = true }) {
                    Text(stringResource(R.string.forgot_password), color = ElectricBlue)
                }
            }
            Spacer(Modifier.height(10.dp))
            PrimaryButton(
                text = stringResource(R.string.sign_in),
                loading = state.loading,
                onClick = {
                    viewModel.login(email, password) {
                        appViewModel.refresh()
                        onLoggedIn()
                    }
                },
            )
            Spacer(Modifier.height(18.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = stringResource(R.string.no_account),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                )
                TextButton(onClick = onRegister) {
                    Text(stringResource(R.string.create_account), color = Emerald)
                }
            }
            Spacer(Modifier.height(24.dp))
            Text(
                text = stringResource(R.string.security_note),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
fun RegisterScreen(
    appViewModel: AppViewModel,
    onRegistered: () -> Unit,
    onBackToLogin: () -> Unit,
) {
    val viewModel: AuthViewModel = hiltViewModel()
    val state = viewModel.state
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var agreed by remember { mutableStateOf(false) }
    var localError by remember { mutableStateOf<String?>(null) }

    GradientScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(horizontal = 24.dp, vertical = 24.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                LaqeeniLogo(size = 64.dp, animated = false)
                Spacer(Modifier.padding(6.dp))
                Column {
                    Text(
                        text = stringResource(R.string.app_name),
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        text = stringResource(R.string.welcome_tagline),
                        style = MaterialTheme.typography.bodySmall,
                        color = Emerald,
                    )
                }
            }
            Spacer(Modifier.height(24.dp))
            Text(
                text = stringResource(R.string.register_title),
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.register_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
            val error = localError ?: state.error
            if (error != null) {
                Banner(error)
                Spacer(Modifier.height(12.dp))
            }
            LaqeeniField(
                value = name,
                onValueChange = { name = it; localError = null },
                label = stringResource(R.string.full_name),
                leadingIcon = Icons.Filled.Person,
                enabled = !state.loading,
            )
            Spacer(Modifier.height(12.dp))
            LaqeeniField(
                value = email,
                onValueChange = { email = it; localError = null },
                label = stringResource(R.string.email),
                leadingIcon = Icons.Filled.Email,
                keyboardType = KeyboardType.Email,
                enabled = !state.loading,
            )
            Spacer(Modifier.height(12.dp))
            LaqeeniField(
                value = password,
                onValueChange = { password = it; localError = null },
                label = stringResource(R.string.password),
                leadingIcon = Icons.Filled.Lock,
                isPassword = true,
                enabled = !state.loading,
                supportingText = "10+ characters, upper & lower case, a number",
            )
            Spacer(Modifier.height(12.dp))
            LaqeeniField(
                value = confirm,
                onValueChange = { confirm = it; localError = null },
                label = stringResource(R.string.confirm_password),
                leadingIcon = Icons.Filled.Lock,
                isPassword = true,
                enabled = !state.loading,
            )
            Spacer(Modifier.height(14.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = agreed, onCheckedChange = { agreed = it })
                Text(
                    text = stringResource(R.string.agree_terms),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.clickable { agreed = !agreed },
                )
            }
            Spacer(Modifier.height(12.dp))
            PrimaryButton(
                text = stringResource(R.string.create_account),
                loading = state.loading,
                onClick = {
                    val valid = Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{10,128}$")
                    when {
                        name.isBlank() -> localError = "Enter your name"
                        !android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches() ->
                            localError = "Enter a valid e-mail address"
                        !valid.matches(password) ->
                            localError = "Password needs 10+ characters, upper and lower case, and a number"
                        password != confirm -> localError = "Passwords do not match"
                        !agreed -> localError = "Please accept the terms to continue"
                        else -> viewModel.register(name, email, password) {
                            appViewModel.refresh()
                            onRegistered()
                        }
                    }
                },
            )
            Spacer(Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = stringResource(R.string.have_account),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                )
                TextButton(onClick = onBackToLogin) {
                    Text(stringResource(R.string.sign_in), color = Emerald)
                }
            }
            Spacer(Modifier.height(18.dp))
            Text(
                text = stringResource(R.string.privacy_note),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun TwoFactorDialog(
    loading: Boolean,
    error: String?,
    onDismiss: () -> Unit,
    onVerify: (String) -> Unit,
) {
    var code by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.two_factor_challenge_title)) },
        text = {
            Column {
                Text(stringResource(R.string.two_factor_challenge_text))
                Spacer(Modifier.height(12.dp))
                LaqeeniField(
                    value = code,
                    onValueChange = { value ->
                        code = value.filter { it.isDigit() }.take(6)
                    },
                    label = stringResource(R.string.enter_6_digit),
                    keyboardType = KeyboardType.Number,
                )
                if (error != null) {
                    Spacer(Modifier.height(10.dp))
                    Banner(error)
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onVerify(code) },
                enabled = code.length == 6 && !loading,
            ) {
                Text(stringResource(R.string.verify), color = ElectricBlue)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
}

@Composable
private fun ForgotPasswordDialog(
    initialEmail: String,
    onDismiss: () -> Unit,
    onSend: (String) -> Unit,
) {
    var email by remember { mutableStateOf(initialEmail) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.forgot_password)) },
        text = {
            Column {
                Text(stringResource(R.string.forgot_password_sent))
                Spacer(Modifier.height(12.dp))
                LaqeeniField(
                    value = email,
                    onValueChange = { email = it },
                    label = stringResource(R.string.email),
                    leadingIcon = Icons.Filled.Email,
                    keyboardType = KeyboardType.Email,
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onSend(email) }, enabled = email.contains("@")) {
                Text(stringResource(R.string.send_message), color = ElectricBlue)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) }
        },
        containerColor = MaterialTheme.colorScheme.surface,
    )
}
