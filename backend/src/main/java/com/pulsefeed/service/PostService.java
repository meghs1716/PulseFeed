package com.pulsefeed.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pulsefeed.model.Post;
import com.pulsefeed.model.User;
import com.pulsefeed.repository.PostRepository;
import com.pulsefeed.repository.UserRepository;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(
            PostRepository postRepository,
            UserRepository userRepository) {

        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public Post createPost(String email, String content) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Post cannot be empty");
        }

        if (content.length() > 280) {
            throw new RuntimeException(
                    "Post cannot contain more than 280 characters");
        }

        Post post = new Post(
                user,
                content.trim()
        );

        return postRepository.save(post);
    }

    public List<Post> getAllPosts() {

        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Post> getUserPosts(Long userId) {

        return postRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void deletePost(Long postId, String email) {

        Post post = postRepository
                .findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Post not found"));

        if (!post.getUser().getEmail().equals(email)) {
            throw new RuntimeException(
                    "You can only delete your own posts");
        }

        postRepository.delete(post);
    }
}