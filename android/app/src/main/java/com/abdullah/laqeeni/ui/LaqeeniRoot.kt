package com.abdullah.laqeeni.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddLink
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.abdullah.laqeeni.R
import com.abdullah.laqeeni.ui.screens.DashboardScreen
import com.abdullah.laqeeni.ui.screens.DeviceScreen
import com.abdullah.laqeeni.ui.screens.LoginScreen
import com.abdullah.laqeeni.ui.screens.MapScreen
import com.abdullah.laqeeni.ui.screens.OnboardingScreen
import com.abdullah.laqeeni.ui.screens.PairScreen
import com.abdullah.laqeeni.ui.screens.RegisterScreen
import com.abdullah.laqeeni.ui.screens.SecurityScreen
import com.abdullah.laqeeni.ui.screens.SettingsScreen
import com.abdullah.laqeeni.ui.screens.SplashScreen
import com.abdullah.laqeeni.ui.theme.LaqeeniTheme
import com.abdullah.laqeeni.ui.viewmodel.AppViewModel
import kotlinx.coroutines.flow.StateFlow

private data class NavItem(
    val route: String,
    val label: Int,
    val icon: ImageVector,
)

private val mainItems = listOf(
    NavItem("dashboard", R.string.dashboard, Icons.Filled.Home),
    NavItem("map", R.string.map, Icons.Filled.Map),
    NavItem("pair", R.string.pair_device, Icons.Filled.AddLink),
    NavItem("settings", R.string.settings, Icons.Filled.Settings),
)

private val mainRoutes = mainItems.map { it.route }.toSet()

@Composable
fun LaqeeniRoot(pairLink: StateFlow<String?>) {
    val appViewModel: AppViewModel = hiltViewModel()
    val darkTheme = when (appViewModel.themeMode) {
        "dark" -> true
        "light" -> false
        else -> isSystemInDarkTheme()
    }

    LaqeeniTheme(darkTheme = darkTheme) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background,
        ) {
            var splashDone by rememberSaveable { mutableStateOf(false) }

            Box(Modifier.fillMaxSize()) {
                when {
                    !splashDone -> SplashScreen(onReady = { splashDone = true })
                    !appViewModel.onboardingComplete -> OnboardingScreen(
                        onDone = { appViewModel.completeOnboarding() },
                    )
                    else -> AppShell(appViewModel = appViewModel, pairLink = pairLink)
                }
            }
        }
    }
}

@Composable
private fun AppShell(
    appViewModel: AppViewModel,
    pairLink: StateFlow<String?>,
) {
    val navController = rememberNavController()
    val incomingCode by pairLink.collectAsState()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val currentTab = currentRoute?.substringBefore("?")
    val wide = LocalConfiguration.current.screenWidthDp >= 720

    var lastHandledCode by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(incomingCode, appViewModel.signedIn) {
        val code = incomingCode?.trim().orEmpty()
        if (!appViewModel.signedIn || code.isBlank() || lastHandledCode == code) return@LaunchedEffect
        if (navController.currentDestination == null) return@LaunchedEffect
        lastHandledCode = code
        navController.navigate("pair?code=${java.net.URLEncoder.encode(code, "UTF-8")}") {
            launchSingleTop = true
        }
    }

    val showNavigation = currentTab == null || currentTab in mainRoutes
    val startDestination = if (appViewModel.signedIn) "dashboard" else "login"

    fun navigateMain(route: String) {
        navController.navigate(route) {
            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    Scaffold(
        bottomBar = {
            if (!wide && showNavigation) {
                BottomBar(
                    currentRoute = currentTab,
                    onNavigate = ::navigateMain,
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Row(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (wide && showNavigation) {
                NavigationRail(containerColor = MaterialTheme.colorScheme.surface) {
                    mainItems.forEach { item ->
                        NavigationRailItem(
                            selected = currentTab == item.route,
                            onClick = { navigateMain(item.route) },
                            icon = {
                                Icon(item.icon, contentDescription = stringResource(item.label))
                            },
                            label = { Text(stringResource(item.label)) },
                        )
                    }
                }
            }
            AppNavGraph(
                navController = navController,
                appViewModel = appViewModel,
                startDestination = startDestination,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun BottomBar(currentRoute: String?, onNavigate: (String) -> Unit) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        mainItems.forEach { item ->
            NavigationBarItem(
                selected = currentRoute == item.route,
                onClick = { onNavigate(item.route) },
                icon = { Icon(item.icon, contentDescription = stringResource(item.label)) },
                label = {
                    Text(
                        text = stringResource(item.label),
                        maxLines = 1,
                    )
                },
            )
        }
    }
}

@Composable
private fun AppNavGraph(
    navController: NavHostController,
    appViewModel: AppViewModel,
    startDestination: String,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier,
    ) {
        composable("login") {
            LoginScreen(
                appViewModel = appViewModel,
                onLoggedIn = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                        launchSingleTop = true
                    }
                },
                onRegister = { navController.navigate("register") },
            )
        }

        composable("register") {
            RegisterScreen(
                appViewModel = appViewModel,
                onRegistered = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                        launchSingleTop = true
                    }
                },
                onBackToLogin = { navController.popBackStack() },
            )
        }

        composable("dashboard") {
            DashboardScreen(
                appViewModel = appViewModel,
                onOpenDevice = { id -> navController.navigate("device/$id") },
                onAddDevice = { navController.navigate("pair") },
                onOpenSettings = { navController.navigate("settings") },
                onOpenSecurity = { navController.navigate("security") },
            )
        }

        composable("map") {
            MapScreen(
                appViewModel = appViewModel,
                onOpenDevice = { id -> navController.navigate("device/$id") },
                onAddDevice = { navController.navigate("pair") },
            )
        }

        composable(
            route = "pair?code={code}",
            arguments = listOf(
                navArgument("code") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                },
            ),
        ) { entry ->
            val code = entry.arguments?.getString("code")
            PairScreen(
                appViewModel = appViewModel,
                initialCode = code,
                onLinked = {
                    appViewModel.refresh()
                    navController.navigate("dashboard") {
                        popUpTo("dashboard") { inclusive = false }
                        launchSingleTop = true
                    }
                },
                onOpenDevice = { id -> navController.navigate("device/$id") },
            )
        }

        composable("settings") {
            SettingsScreen(
                appViewModel = appViewModel,
                onOpenSecurity = { navController.navigate("security") },
                onOpenPair = { navController.navigate("pair") },
                onSignedOut = {
                    appViewModel.refresh()
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }

        composable("security") {
            SecurityScreen(
                appViewModel = appViewModel,
                onBack = { navController.popBackStack() },
                onSignedOut = {
                    appViewModel.refresh()
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }

        composable(
            route = "device/{deviceId}",
            arguments = listOf(
                navArgument("deviceId") { type = NavType.StringType },
            ),
        ) {
            DeviceScreen(
                appViewModel = appViewModel,
                onBack = { navController.popBackStack() },
                onDeleted = {
                    navController.navigate("dashboard") {
                        popUpTo("dashboard") { inclusive = false }
                        launchSingleTop = true
                    }
                },
            )
        }
    }
}
