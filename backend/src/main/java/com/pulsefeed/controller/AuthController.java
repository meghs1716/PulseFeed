package com.pulsefeed.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulsefeed.dto.LoginRequest;
import com.pulsefeed.dto.RegisterRequest;
import com.pulsefeed.service.AuthService;

import jakarta.validation.Valid;
import com.pulsefeed.model.User;
import com.pulsefeed.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(
        AuthService authService,
        UserRepository userRepository) {

    this.authService = authService;
    this.userRepository = userRepository;
}

    // =========================
    // REGISTER
    // =========================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        try {

            String token = authService.register(request);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Registration successful",
                            "token", token,
                            "username", request.getUsername().trim(),
                            "email", request.getEmail().trim()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message", e.getMessage()
                            )
                    );
        }
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {

            String token = authService.login(request);
            User user = userRepository
                    .findByEmail(request.getEmail().trim())
                    .orElse(null);

            String username = user != null ? user.getUsername() : "";
            String email = user != null ? user.getEmail() : request.getEmail().trim();

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Login successful",
                            "token", token,
                            "username", username,
                            "email", email
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message", e.getMessage()
                            )
                    );
        }
    }

    // =========================
    // CURRENT USER
    // =========================
@GetMapping("/me")
public ResponseEntity<?> getCurrentUser(
        Authentication authentication) {

    if (authentication == null) {
        return ResponseEntity
                .status(401)
                .body(Map.of(
                        "message",
                        "Not authenticated"
                ));
    }

    User user = userRepository
            .findByEmail(authentication.getName())
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    return ResponseEntity.ok(
            Map.of(
                    "email", user.getEmail(),
                    "username", user.getUsername(),
                    "message", "JWT authentication is working"
            )
    );
}
}