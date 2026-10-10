package com.pulsefeed.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pulsefeed.model.User;
import com.pulsefeed.repository.FollowRepository;
import com.pulsefeed.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;


    public UserController(
            UserRepository userRepository,
            FollowRepository followRepository) {

        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }

@GetMapping("/search")
public ResponseEntity<?> searchUsers(
        @RequestParam String query,
        Authentication authentication) {

    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401)
                .body(Map.of("message", "Unauthorized"));
    }

    List<User> users = userRepository
            .findByUsernameContainingIgnoreCase(query);

    List<Map<String, Object>> results = users.stream()
            .map(user -> Map.<String, Object>of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "bio", user.getBio() == null ? "" : user.getBio()
            ))
            .toList();

    return ResponseEntity.ok(results);
}

    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(
            @PathVariable String username,
            Authentication authentication) {

        User profileUser = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        User currentUser = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new RuntimeException("Current user not found"));

        boolean isFollowing =
        followRepository.existsByFollowerIdAndFollowingId(
                currentUser.getId(),
                profileUser.getId()
        );

long followers =
        followRepository.countByFollowingId(
                profileUser.getId()
        );

long following =
        followRepository.countByFollowerId(
                profileUser.getId()
        );

        return ResponseEntity.ok(
                Map.of(
                        "username",
                        profileUser.getUsername(),

                        "email",
                        profileUser.getEmail(),

                        "bio",
                        profileUser.getBio() == null
                                ? ""
                                : profileUser.getBio(),

                        "followers",
                        followers,

                        "following",
                        following,

                        "isFollowing",
                        isFollowing
                )
        );
    }
@PutMapping("/me")
public ResponseEntity<?> updateMyProfile(
        @RequestBody Map<String, String> request,
        Authentication authentication) {

    if (authentication == null) {
        return ResponseEntity.status(401)
                .body(Map.of("message", "Unauthorized"));
    }

    User currentUser = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

    String bio = request.getOrDefault("bio", "");

    if (bio.length() > 160) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Bio cannot exceed 160 characters"));
    }

    currentUser.setBio(bio.trim());
    userRepository.save(currentUser);

    return ResponseEntity.ok(Map.of("bio", currentUser.getBio()));
}
}