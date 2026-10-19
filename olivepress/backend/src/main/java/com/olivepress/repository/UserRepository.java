package com.olivepress.repository;

import com.olivepress.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    List<User> findAllByOrderByFullNameAsc();
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
