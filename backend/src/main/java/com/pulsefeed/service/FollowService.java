package com.pulsefeed.service;

import org.springframework.stereotype.Service;

import com.pulsefeed.model.Follow;
import com.pulsefeed.model.User;
import com.pulsefeed.repository.FollowRepository;
import com.pulsefeed.repository.UserRepository;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(
            FollowRepository followRepository,
            UserRepository userRepository) {

        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    public boolean toggleFollow(String followerEmail, Long followingId) {

        User follower = userRepository
                .findByEmail(followerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Follower not found"));

        User following = userRepository
                .findById(followingId)
                .orElseThrow(() ->
                        new RuntimeException("User to follow not found"));

        if (follower.getId().equals(following.getId())) {
            throw new RuntimeException(
                    "You cannot follow yourself"
            );
        }

        var existingFollow =
                followRepository.findByFollowerIdAndFollowingId(
                        follower.getId(),
                        following.getId()
                );

        if (existingFollow.isPresent()) {

            followRepository.delete(existingFollow.get());

            return false;
        }

        Follow follow = new Follow(
                follower,
                following
        );

        followRepository.save(follow);

        return true;
    }

    public boolean isFollowing(
            String followerEmail,
            Long followingId) {

        User follower = userRepository
                .findByEmail(followerEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return followRepository.existsByFollowerIdAndFollowingId(
                follower.getId(),
                followingId
        );
    }

    public long getFollowerCount(Long userId) {
        return followRepository.countByFollowingId(userId);
    }

    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerId(userId);
    }
}